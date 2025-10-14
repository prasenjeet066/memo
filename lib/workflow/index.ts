// EventFlow - A lightweight event-driven workflow library
// Similar to Inngest but simplified

type EventHandler = (payload: any) => Promise<any> | any;
type StepFunction<T = any> = () => Promise<T> | T;

interface StepConfig {
  id: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface FunctionConfig {
  id: string;
  name?: string;
  retries?: number;
}

interface EventConfig {
  event: string | string[];
}

interface StepResult {
  stepId: string;
  data: any;
  error?: Error;
  attempts: number;
  completedAt: Date;
}

interface WorkflowState {
  functionId: string;
  eventName: string;
  steps: Map<string, StepResult>;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
}

class StepRunner {
  private state: Map<string, any> = new Map();
  private stepResults: Map<string, StepResult> = new Map();

  async run<T>(
    stepId: string,
    fn: StepFunction<T>,
    config?: { maxRetries?: number; retryDelay?: number }
  ): Promise<T> {
    const maxRetries = config?.maxRetries ?? 3;
    const retryDelay = config?.retryDelay ?? 1000;

    // Check if step already completed
    if (this.stepResults.has(stepId)) {
      const result = this.stepResults.get(stepId)!;
      if (!result.error) {
        console.log(`✓ Step "${stepId}" - Using cached result`);
        return result.data;
      }
    }

    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`→ Step "${stepId}" - Attempt ${attempt}/${maxRetries}`);
        const result = await fn();
        
        // Save successful result
        this.stepResults.set(stepId, {
          stepId,
          data: result,
          attempts: attempt,
          completedAt: new Date()
        });
        
        console.log(`✓ Step "${stepId}" - Completed successfully`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.log(`✗ Step "${stepId}" - Failed (attempt ${attempt})`);
        
        if (attempt < maxRetries) {
          console.log(`  Retrying in ${retryDelay}ms...`);
          await this.sleep(retryDelay);
        }
      }
    }

    // All retries failed
    this.stepResults.set(stepId, {
      stepId,
      data: null,
      error: lastError,
      attempts: maxRetries,
      completedAt: new Date()
    });

    throw new Error(`Step "${stepId}" failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStepResults(): Map<string, StepResult> {
    return this.stepResults;
  }
}

class EventFlow {
  private functions: Map<string, {
    config: FunctionConfig;
    eventConfig: EventConfig;
    handler: (context: { event: any; step: StepRunner }) => Promise<any>;
  }> = new Map();

  private eventListeners: Map<string, Set<string>> = new Map();
  private workflowHistory: WorkflowState[] = [];

  createFunction(
    config: FunctionConfig,
    eventConfig: EventConfig,
    handler: (context: { event: any; step: StepRunner }) => Promise<any>
  ) {
    this.functions.set(config.id, { config, eventConfig, handler });

    // Register event listeners
    const events = Array.isArray(eventConfig.event) 
      ? eventConfig.event 
      : [eventConfig.event];

    events.forEach(eventName => {
      if (!this.eventListeners.has(eventName)) {
        this.eventListeners.set(eventName, new Set());
      }
      this.eventListeners.get(eventName)!.add(config.id);
    });

    console.log(`📝 Function "${config.id}" registered for events: ${events.join(', ')}`);
    
    return this;
  }

  async send(eventName: string, data: any = {}) {
    console.log(`\n🚀 Event "${eventName}" triggered`);
    
    const listeners = this.eventListeners.get(eventName);
    if (!listeners || listeners.size === 0) {
      console.log(`⚠️  No functions listening to "${eventName}"`);
      return [];
    }

    const results = [];

    for (const functionId of listeners) {
      const fn = this.functions.get(functionId);
      if (!fn) continue;

      const workflowState: WorkflowState = {
        functionId,
        eventName,
        steps: new Map(),
        status: 'running',
        startedAt: new Date()
      };

      try {
        console.log(`\n▶ Running function "${functionId}"`);
        const stepRunner = new StepRunner();
        
        const result = await fn.handler({
          event: { name: eventName, data },
          step: stepRunner
        });

        workflowState.status = 'completed';
        workflowState.completedAt = new Date();
        workflowState.steps = stepRunner.getStepResults();
        
        results.push({ functionId, result, error: null });
        console.log(`✓ Function "${functionId}" completed successfully\n`);
      } catch (error) {
        workflowState.status = 'failed';
        workflowState.completedAt = new Date();
        
        results.push({ functionId, result: null, error });
        console.log(`✗ Function "${functionId}" failed: ${(error as Error).message}\n`);
      }

      this.workflowHistory.push(workflowState);
    }

    return results;
  }

  // Scheduled/Cron functionality
  createSchedule(
    config: FunctionConfig,
    schedule: { cron: string } | { every: string },
    handler: (context: { step: StepRunner }) => Promise<any>
  ) {
    console.log(`⏰ Scheduled function "${config.id}" created`);
    
    // In a real implementation, this would use node-cron or similar
    // For demo purposes, we'll just store it
    
    return this;
  }

  getWorkflowHistory(): WorkflowState[] {
    return this.workflowHistory;
  }

  getRegisteredFunctions(): string[] {
    return Array.from(this.functions.keys());
  }
}

// Export the main class and create a default instance
export const eventFlow = new EventFlow();
export { EventFlow, StepRunner };
