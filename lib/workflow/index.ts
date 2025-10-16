// MemoFlow - Enhanced event-driven workflow library
// Improved version with better error handling, concurrency, and type safety

import { EventEmitter } from 'events';

// ============= Types & Interfaces =============

type StepFunction<T = unknown> = (signal?: AbortSignal) => Promise<T> | T;

interface StepConfig {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  timeout?: number;
  retryableErrors?: Array<new (...args: any[]) => Error>;
}

interface FunctionConfig {
  id: string;
  name?: string;
  retries?: number;
  timeout?: number;
  concurrency?: number;
}

interface EventConfig {
  event: string | string[];
  filter?: (data: any) => boolean;
}

interface StepResult<T = unknown> {
  stepId: string;
  data: T | null;
  error?: Error;
  attempts: number;
  startedAt: Date;
  completedAt: Date;
  duration: number;
}

interface WorkflowState {
  workflowId: string;
  functionId: string;
  eventName: string;
  steps: Map<string, StepResult>;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: Error;
}

interface ExecutionResult {
  functionId: string;
  workflowId: string;
  result: any;
  error: Error | null;
  duration: number;
}

interface MemoFlowConfig {
  maxHistorySize?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  persistenceAdapter?: PersistenceAdapter;
}

interface PersistenceAdapter {
  save(state: WorkflowState): Promise<void>;
  load(workflowId: string): Promise<WorkflowState | null>;
  clear(workflowId: string): Promise<void>;
}

// ============= Custom Errors =============

class StepExecutionError extends Error {
  constructor(
    public stepId: string,
    public attempts: number,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StepExecutionError';
  }
}

class WorkflowTimeoutError extends Error {
  constructor(public workflowId: string, message: string) {
    super(message);
    this.name = 'WorkflowTimeoutError';
  }
}

class WorkflowCancelledError extends Error {
  constructor(public workflowId: string) {
    super(`Workflow ${workflowId} was cancelled`);
    this.name = 'WorkflowCancelledError';
  }
}

// ============= Logger =============

class Logger {
  constructor(
    private enabled: boolean = true,
    private level: 'debug' | 'info' | 'warn' | 'error' = 'info'
  ) {}

  private levels = { debug: 0, info: 1, warn: 2, error: 3 };

  private shouldLog(level: keyof typeof this.levels): boolean {
    return this.enabled && this.levels[level] >= this.levels[this.level];
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) console.log(`[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) console.log(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) console.error(`[ERROR] ${message}`, ...args);
  }
}

// ============= Step Runner =============

class StepRunner {
  private stepResults: Map<string, StepResult> = new Map();
  private abortController: AbortController;
  private logger: Logger;

  constructor(logger: Logger, abortController: AbortController) {
    this.logger = logger;
    this.abortController = abortController;
  }

  async run<T>(
    stepId: string,
    fn: StepFunction<T>,
    config?: StepConfig
  ): Promise<T> {
    // Check for cancellation
    if (this.abortController.signal.aborted) {
      throw new WorkflowCancelledError('workflow');
    }

    // Check cache
    if (this.stepResults.has(stepId)) {
      const result = this.stepResults.get(stepId)!;
      if (!result.error) {
        this.logger.debug(`✓ Step "${stepId}" - Using cached result`);
        return result.data as T;
      }
    }

    const maxRetries = config?.maxRetries ?? 3;
    const initialDelay = config?.retryDelay ?? 1000;
    const backoffMultiplier = config?.backoffMultiplier ?? 2;
    const timeout = config?.timeout;
    const retryableErrors = config?.retryableErrors ?? [];

    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`→ Step "${stepId}" - Attempt ${attempt}/${maxRetries}`);

        const result = timeout
          ? await this.executeWithTimeout(fn, timeout)
          : await fn(this.abortController.signal);

        const completedAt = new Date();
        const duration = Date.now() - startTime;

        this.stepResults.set(stepId, {
          stepId,
          data: result,
          attempts: attempt,
          startedAt: new Date(startTime),
          completedAt,
          duration
        });

        this.logger.info(`✓ Step "${stepId}" - Completed (${duration}ms)`);
        return result;
      } catch (error) {
        const err = this.normalizeError(error);
        lastError = err;

        this.logger.warn(`✗ Step "${stepId}" - Failed (attempt ${attempt}): ${err.message}`);

        // Check if error is retryable
        const isRetryable = this.isRetryableError(err, retryableErrors);
        if (!isRetryable || attempt >= maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
        this.logger.debug(`  Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // All retries failed
    const completedAt = new Date();
    const duration = Date.now() - startTime;

    this.stepResults.set(stepId, {
      stepId,
      data: null,
      error: lastError,
      attempts: maxRetries,
      startedAt: new Date(startTime),
      completedAt,
      duration
    });

    throw new StepExecutionError(
      stepId,
      maxRetries,
      `Step "${stepId}" failed after ${maxRetries} attempts`,
      lastError
    );
  }

  private async executeWithTimeout<T>(
    fn: StepFunction<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(this.abortController.signal),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) return error;
    if (typeof error === 'string') return new Error(error);
    return new Error(String(error));
  }

  private isRetryableError(
    error: Error,
    retryableErrors: Array<new (...args: any[]) => Error>
  ): boolean {
    if (retryableErrors.length === 0) return true;
    return retryableErrors.some(ErrorClass => error instanceof ErrorClass);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStepResults(): Map<string, StepResult> {
    return new Map(this.stepResults);
  }

  cancel() {
    this.abortController.abort();
  }
}

// ============= Circuit Breaker =============

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private logger: Logger
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        this.logger.info('Circuit breaker: half-open');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.logger.info('Circuit breaker: closed');
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      this.logger.warn('Circuit breaker: OPEN');
    }
  }

  getState() {
    return this.state;
  }
}

// ============= Main MemoFlow Class =============

class MemoFlow extends EventEmitter {
  private functions = new Map<
    string,
    {
      config: FunctionConfig;
      eventConfig: EventConfig;
      handler: (context: {
        event: { name: string; data: any };
        step: StepRunner;
      }) => Promise<any>;
      circuitBreaker: CircuitBreaker;
    }
  >();

  private eventListeners = new Map<string, Set<string>>();
  private workflowHistory: WorkflowState[] = [];
  private activeWorkflows = new Map<string, AbortController>();
  private logger: Logger;
  private config: Required<MemoFlowConfig>;

  constructor(config: MemoFlowConfig = {}) {
    super();
    this.config = {
      maxHistorySize: config.maxHistorySize ?? 1000,
      enableLogging: config.enableLogging ?? true,
      logLevel: config.logLevel ?? 'info',
      persistenceAdapter: config.persistenceAdapter ?? null as any
    };
    this.logger = new Logger(this.config.enableLogging, this.config.logLevel);
  }

  createFunction(
    config: FunctionConfig,
    eventConfig: EventConfig,
    handler: (context: {
      event: { name: string; data: any };
      step: StepRunner;
    }) => Promise<any>
  ): this {
    if (!config.id || config.id.trim() === '') {
      throw new Error('Function ID cannot be empty');
    }

    if (this.functions.has(config.id)) {
      this.logger.warn(`Function "${config.id}" already exists. Overwriting...`);
    }

    const circuitBreaker = new CircuitBreaker(5, 60000, this.logger);

    this.functions.set(config.id, {
      config,
      eventConfig,
      handler,
      circuitBreaker
    });

    // Register event listeners
    const events = Array.isArray(eventConfig.event)
      ? eventConfig.event
      : [eventConfig.event];

    events.forEach(eventName => {
      if (!eventName || eventName.trim() === '') {
        throw new Error('Event name cannot be empty');
      }

      if (!this.eventListeners.has(eventName)) {
        this.eventListeners.set(eventName, new Set());
      }
      this.eventListeners.get(eventName)!.add(config.id);
    });

    this.logger.info(
      `📝 Function "${config.id}" registered for events: ${events.join(', ')}`
    );

    return this;
  }

  async send(eventName: string, data: any = {}): Promise<ExecutionResult[]> {
    this.logger.info(`🚀 Event "${eventName}" triggered`);

    const listeners = this.eventListeners.get(eventName);
    if (!listeners || listeners.size === 0) {
      this.logger.warn(`⚠️  No functions listening to "${eventName}"`);
      return [];
    }

    // Execute all listeners in parallel
    const executions = Array.from(listeners).map(functionId =>
      this.executeFunction(functionId, eventName, data)
    );

    const results = await Promise.allSettled(executions);

    return results.map((result, index) => {
      const functionId = Array.from(listeners)[index];
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          functionId,
          workflowId: '',
          result: null,
          error: result.reason as Error,
          duration: 0
        };
      }
    });
  }

  private async executeFunction(
    functionId: string,
    eventName: string,
    data: any
  ): Promise<ExecutionResult> {
    const fn = this.functions.get(functionId);
    if (!fn) {
      throw new Error(`Function "${functionId}" not found`);
    }

    // Apply event filter
    if (fn.eventConfig.filter && !fn.eventConfig.filter(data)) {
      this.logger.debug(`Function "${functionId}" filtered out by condition`);
      return {
        functionId,
        workflowId: '',
        result: null,
        error: null,
        duration: 0
      };
    }

    const workflowId = `${functionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const abortController = new AbortController();
    this.activeWorkflows.set(workflowId, abortController);

    const workflowState: WorkflowState = {
      workflowId,
      functionId,
      eventName,
      steps: new Map(),
      status: 'running',
      startedAt: new Date()
    };

    const startTime = Date.now();

    try {
      this.logger.info(`▶ Running function "${functionId}" (${workflowId})`);

      const stepRunner = new StepRunner(this.logger, abortController);

      const result = await fn.circuitBreaker.execute(async () => {
        return await fn.handler({
          event: { name: eventName, data },
          step: stepRunner
        });
      });

      const duration = Date.now() - startTime;

      workflowState.status = 'completed';
      workflowState.completedAt = new Date();
      workflowState.duration = duration;
      workflowState.steps = stepRunner.getStepResults();

      this.logger.info(`✓ Function "${functionId}" completed (${duration}ms)`);

      this.emit('workflow:completed', workflowState);

      return { functionId, workflowId, result, error: null, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      workflowState.status = abortController.signal.aborted ? 'cancelled' : 'failed';
      workflowState.completedAt = new Date();
      workflowState.duration = duration;
      workflowState.error = err;

      this.logger.error(`✗ Function "${functionId}" failed: ${err.message}`);

      this.emit('workflow:failed', workflowState);

      return { functionId, workflowId, result: null, error: err, duration };
    } finally {
      this.addToHistory(workflowState);
      this.activeWorkflows.delete(workflowId);

      // Persist if adapter is available
      if (this.config.persistenceAdapter) {
        await this.config.persistenceAdapter.save(workflowState);
      }
    }
  }

  private addToHistory(state: WorkflowState) {
    this.workflowHistory.push(state);

    // Limit history size
    if (this.workflowHistory.length > this.config.maxHistorySize) {
      const removed = this.workflowHistory.shift();
      if (removed && this.config.persistenceAdapter) {
        this.config.persistenceAdapter.clear(removed.workflowId);
      }
    }
  }

  cancelWorkflow(workflowId: string): boolean {
    const controller = this.activeWorkflows.get(workflowId);
    if (controller) {
      controller.abort();
      this.logger.info(`Workflow ${workflowId} cancelled`);
      return true;
    }
    return false;
  }

  unregisterFunction(functionId: string): boolean {
    const fn = this.functions.get(functionId);
    if (!fn) return false;

    // Remove from event listeners
    const events = Array.isArray(fn.eventConfig.event)
      ? fn.eventConfig.event
      : [fn.eventConfig.event];

    events.forEach(eventName => {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        listeners.delete(functionId);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventName);
        }
      }
    });

    this.functions.delete(functionId);
    this.logger.info(`Function "${functionId}" unregistered`);
    return true;
  }

  getWorkflowHistory(filter?: {
    functionId?: string;
    status?: WorkflowState['status'];
    limit?: number;
  }): WorkflowState[] {
    let history = [...this.workflowHistory];

    if (filter?.functionId) {
      history = history.filter(w => w.functionId === filter.functionId);
    }

    if (filter?.status) {
      history = history.filter(w => w.status === filter.status);
    }

    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  getActiveWorkflows(): string[] {
    return Array.from(this.activeWorkflows.keys());
  }

  getRegisteredFunctions(): Array<{ id: string; events: string[] }> {
    return Array.from(this.functions.entries()).map(([id, fn]) => ({
      id,
      events: Array.isArray(fn.eventConfig.event)
        ? fn.eventConfig.event
        : [fn.eventConfig.event]
    }));
  }

  getMetrics() {
    const total = this.workflowHistory.length;
    const completed = this.workflowHistory.filter(w => w.status === 'completed').length;
    const failed = this.workflowHistory.filter(w => w.status === 'failed').length;
    const cancelled = this.workflowHistory.filter(w => w.status === 'cancelled').length;
    const avgDuration =
      this.workflowHistory.reduce((sum, w) => sum + (w.duration || 0), 0) / total || 0;

    return {
      total,
      completed,
      failed,
      cancelled,
      active: this.activeWorkflows.size,
      successRate: total > 0 ? (completed / total) * 100 : 0,
      avgDuration: Math.round(avgDuration)
    };
  }

  clearHistory() {
    this.workflowHistory = [];
    this.logger.info('Workflow history cleared');
  }
}

// ============= Export =============

export const memoFlow = new MemoFlow();
export {
  MemoFlow,
  StepRunner,
  Logger,
  CircuitBreaker,
  StepExecutionError,
  WorkflowTimeoutError,
  WorkflowCancelledError
};

export type {
  StepFunction,
  StepConfig,
  FunctionConfig,
  EventConfig,
  StepResult,
  WorkflowState,
  ExecutionResult,
  MemoFlowConfig,
  PersistenceAdapter
};
