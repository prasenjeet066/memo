import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PROGRAMMING_LANGUAGES = [
  "javascript", "typescript", "python", "java", "csharp", "cpp", "c", "php",
  "ruby", "go", "rust", "swift", "kotlin", "scala", "r", "sql", "html", "css",
  "json", "xml", "yaml", "markdown", "bash", "shell", "powershell"
];

const VIDEO_PROVIDERS = ["youtube", "vimeo", "dailymotion", "custom"];

export function EditorDialog({ open, type, data, selection, onClose, onSubmit, editorMode }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (open) {
      setFormData({
        text: selection || "",
        ...data
      });
    }
  }, [open, selection, data]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const renderDialogContent = () => {
    switch (type) {
      case "link":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                value={formData.text || ""}
                onChange={(e) => handleChange("text", e.target.value)}
                placeholder="Enter link text"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={formData.url || ""}
                onChange={(e) => handleChange("url", e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div>
              <Label htmlFor="link-title">Title (optional)</Label>
              <Input
                id="link-title"
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Link title"
              />
            </div>
          </div>
        );

      case "image":
        return (
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="image-src">Image URL</Label>
                <Input
                  id="image-src"
                  value={formData.src || ""}
                  onChange={(e) => handleChange("src", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
              </div>
              <div>
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                  id="image-alt"
                  value={formData.alt || ""}
                  onChange={(e) => handleChange("alt", e.target.value)}
                  placeholder="Image description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image-width">Width (optional)</Label>
                  <Input
                    id="image-width"
                    value={formData.width || ""}
                    onChange={(e) => handleChange("width", e.target.value)}
                    placeholder="e.g., 300"
                    type="number"
                  />
                </div>
                <div>
                  <Label htmlFor="image-height">Height (optional)</Label>
                  <Input
                    id="image-height"
                    value={formData.height || ""}
                    onChange={(e) => handleChange("height", e.target.value)}
                    placeholder="e.g., 200"
                    type="number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image-caption">Caption (optional)</Label>
                <Input
                  id="image-caption"
                  value={formData.caption || ""}
                  onChange={(e) => handleChange("caption", e.target.value)}
                  placeholder="Image caption"
                />
              </div>
            </TabsContent>
            <TabsContent value="upload" className="space-y-4">
              <div>
                <Label htmlFor="image-upload">Choose Image</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        handleChange("src", evt.target?.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        );

      case "video":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-provider">Video Provider</Label>
              <Select
                value={formData.provider || "youtube"}
                onValueChange={(value) => handleChange("provider", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_PROVIDERS.map(provider => (
                    <SelectItem key={provider} value={provider}>
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="video-src">
                {formData.provider === "custom" ? "Video URL" : "Video ID"}
              </Label>
              <Input
                id="video-src"
                value={formData.src || ""}
                onChange={(e) => handleChange("src", e.target.value)}
                placeholder={
                  formData.provider === "youtube" ? "e.g., dQw4w9WgXcQ" :
                  formData.provider === "vimeo" ? "e.g., 123456789" :
                  "Video URL or ID"
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="video-width">Width (optional)</Label>
                <Input
                  id="video-width"
                  value={formData.width || ""}
                  onChange={(e) => handleChange("width", e.target.value)}
                  placeholder="640"
                  type="number"
                />
              </div>
              <div>
                <Label htmlFor="video-height">Height (optional)</Label>
                <Input
                  id="video-height"
                  value={formData.height || ""}
                  onChange={(e) => handleChange("height", e.target.value)}
                  placeholder="360"
                  type="number"
                />
              </div>
            </div>
          </div>
        );

      case "codeBlock":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="code-language">Programming Language</Label>
              <Select
                value={formData.language || "javascript"}
                onValueChange={(value) => handleChange("language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {PROGRAMMING_LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="code-filename">Filename (optional)</Label>
              <Input
                id="code-filename"
                value={formData.filename || ""}
                onChange={(e) => handleChange("filename", e.target.value)}
                placeholder="e.g., index.js"
              />
            </div>
            <div>
              <Label htmlFor="code-content">Code</Label>
              <Textarea
                id="code-content"
                value={formData.code || selection || ""}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="Enter your code here..."
                className="font-mono text-sm min-h-[200px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="code-line-numbers"
                checked={formData.lineNumbers || false}
                onChange={(e) => handleChange("lineNumbers", e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="code-line-numbers" className="cursor-pointer">
                Show line numbers
              </Label>
            </div>
          </div>
        );

      case "math":
        return (
          <div className="space-y-4">
            <div>
              <Label>Display Mode</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="math-display"
                    checked={!formData.display}
                    onChange={() => handleChange("display", false)}
                    className="w-4 h-4"
                  />
                  <span>Inline ($formula$)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="math-display"
                    checked={formData.display}
                    onChange={() => handleChange("display", true)}
                    className="w-4 h-4"
                  />
                  <span>Block ($$formula$$)</span>
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="math-formula">LaTeX Formula</Label>
              <Textarea
                id="math-formula"
                value={formData.formula || ""}
                onChange={(e) => handleChange("formula", e.target.value)}
                placeholder="e.g., E = mc^2 or \frac{a}{b}"
                className="font-mono text-sm min-h-[100px]"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded border">
              <Label className="text-xs text-gray-600 mb-2 block">Preview:</Label>
              <div className="text-center text-lg">
                {formData.formula ? `${formData.display ? '$$' : '$'}${formData.formula}${formData.display ? '$$' : '$'}` : "Formula preview will appear here"}
              </div>
            </div>
          </div>
        );

      case "table":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="table-rows">Number of Rows</Label>
                <Input
                  id="table-rows"
                  type="number"
                  min="2"
                  max="20"
                  value={formData.rows || "3"}
                  onChange={(e) => handleChange("rows", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="table-cols">Number of Columns</Label>
                <Input
                  id="table-cols"
                  type="number"
                  min="2"
                  max="10"
                  value={formData.cols || "3"}
                  onChange={(e) => handleChange("cols", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="table-caption">Caption (optional)</Label>
              <Input
                id="table-caption"
                value={formData.caption || ""}
                onChange={(e) => handleChange("caption", e.target.value)}
                placeholder="Table caption"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="table-header"
                checked={formData.hasHeader !== false}
                onChange={(e) => handleChange("hasHeader", e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="table-header" className="cursor-pointer">
                First row as header
              </Label>
            </div>
          </div>
        );

      case "template":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., infobox, citation, quote"
              />
            </div>
            <div>
              <Label htmlFor="template-params">Parameters (key=value, one per line)</Label>
              <Textarea
                id="template-params"
                value={formData.paramsText || ""}
                onChange={(e) => {
                  handleChange("paramsText", e.target.value);
                  const params = {};
                  e.target.value.split('\n').forEach(line => {
                    const [key, ...valueParts] = line.split('=');
                    if (key && valueParts.length > 0) {
                      params[key.trim()] = valueParts.join('=').trim();
                    }
                  });
                  handleChange("params", params);
                }}
                placeholder="title=Example&#10;author=John Doe&#10;date=2024"
                className="font-mono text-sm min-h-[120px]"
              />
            </div>
          </div>
        );

      case "reference":
        return (
          <Tabs defaultValue="simple" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple">Simple</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Citation</TabsTrigger>
            </TabsList>
            <TabsContent value="simple" className="space-y-4">
              <div>
                <Label htmlFor="ref-id">Reference ID</Label>
                <Input
                  id="ref-id"
                  value={formData.id || ""}
                  onChange={(e) => handleChange("id", e.target.value)}
                  placeholder="e.g., ref1, smith2023"
                />
              </div>
              <div>
                <Label htmlFor="ref-text">Reference Text</Label>
                <Textarea
                  id="ref-text"
                  value={formData.text || ""}
                  onChange={(e) => handleChange("text", e.target.value)}
                  placeholder="Enter the reference text..."
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>
            <TabsContent value="detailed" className="space-y-4">
              <div>
                <Label htmlFor="cite-type">Citation Type</Label>
                <Select
                  value={formData.citeType || "web"}
                  onValueChange={(value) => handleChange("citeType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Website</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="journal">Journal Article</SelectItem>
                    <SelectItem value="news">News Article</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cite-author">Author(s)</Label>
                <Input
                  id="cite-author"
                  value={formData.author || ""}
                  onChange={(e) => handleChange("author", e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="cite-title">Title</Label>
                <Input
                  id="cite-title"
                  value={formData.citationTitle || ""}
                  onChange={(e) => handleChange("citationTitle", e.target.value)}
                  placeholder="Article or book title"
                />
              </div>
              <div>
                <Label htmlFor="cite-url">URL</Label>
                <Input
                  id="cite-url"
                  value={formData.citationUrl || ""}
                  onChange={(e) => handleChange("citationUrl", e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cite-date">Date</Label>
                  <Input
                    id="cite-date"
                    value={formData.date || ""}
                    onChange={(e) => handleChange("date", e.target.value)}
                    placeholder="2024-01-01"
                    type="date"
                  />
                </div>
                <div>
                  <Label htmlFor="cite-access-date">Access Date</Label>
                  <Input
                    id="cite-access-date"
                    value={formData.accessDate || ""}
                    onChange={(e) => handleChange("accessDate", e.target.value)}
                    placeholder="2024-01-01"
                    type="date"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        );

      default:
        return <div>Unknown dialog type: {type}</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-white border-none max-w-xl rounded max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {type === "codeBlock" ? "Code Block" : 
             type === "math" ? "Math Formula" :
             type?.replace(/([A-Z])/g, ' $1').trim() || "Insert"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {renderDialogContent()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}