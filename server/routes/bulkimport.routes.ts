import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { can } from "../middleware/permissions";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { queueHelpers } from "../queue";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export function bulkImportRoutes(app: Express): void {
  app.get("/api/bulk-imports", requireAuth, can("create", "Question"), async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const imports = await storage.getUserBulkImports(user.id);
      res.json(imports);
    } catch (error) {
      console.error("Get bulk imports error:", error);
      res.status(500).json({ error: "Failed to get bulk imports" });
    }
  });

  app.get("/api/bulk-imports/:id", requireAuth, can("create", "Question"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const bulkImport = await storage.getBulkImport(id);
      
      if (!bulkImport) {
        return res.status(404).json({ error: "Bulk import not found" });
      }
      
      res.json(bulkImport);
    } catch (error) {
      console.error("Get bulk import error:", error);
      res.status(500).json({ error: "Failed to get bulk import" });
    }
  });

  app.post("/api/bulk-imports/csv", requireAuth, can("create", "Question"), upload.single('file'), async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      const bulkImport = await storage.createBulkImport({
        userId: user.id,
        fileName: req.file.originalname,
        fileType: 'csv',
        totalRows: records.length,
        status: 'pending',
      });

      const job = await queueHelpers.processBulkImport(bulkImport.id, records);
      
      await storage.updateBulkImport(bulkImport.id, { 
        jobId: job?.id?.toString(),
        status: 'processing'
      });

      res.status(201).json(bulkImport);
    } catch (error) {
      console.error("Bulk import CSV error:", error);
      res.status(500).json({ error: "Failed to process bulk import" });
    }
  });
}
