import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/db';

const contentItemSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  type: z.string().min(1),
  url: z.string().url(),
  platform: z.string().optional(),
  short_description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  estimated_duration: z.string().optional(),
  mood: z.string().optional()
});

export const contentController = {
  getAll: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const items = await db.contentItems.findAll(req.user.id);
      return res.json(items);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch content items." });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const data = contentItemSchema.parse(req.body);
      const item = await db.contentItems.create({
        user_id: req.user.id,
        title: data.title,
        category: data.category,
        type: data.type,
        url: data.url,
        platform: data.platform || 'Website',
        short_description: data.short_description,
        tags: data.tags,
        estimated_duration: data.estimated_duration || '5m',
        mood: data.mood || 'calm',
        is_user_added: true,
        is_default: false,
        is_favourite: false
      });
      return res.status(201).json(item);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const target = await db.contentItems.findAll(req.user.id);
      const item = target.find(i => i.id === req.params.id);
      
      if (!item || item.user_id !== req.user.id) {
        return res.status(404).json({ error: "Content item not found or unauthorized." });
      }

      const updated = await db.contentItems.update(req.params.id, req.body);
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const target = await db.contentItems.findAll(req.user.id);
      const item = target.find(i => i.id === req.params.id);

      if (!item || item.user_id !== req.user.id) {
        return res.status(404).json({ error: "Content item not found or unauthorized." });
      }

      await db.contentItems.delete(req.params.id);
      return res.json({ message: "Content item deleted." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  favourite: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const target = await db.contentItems.findAll(req.user.id);
      const item = target.find(i => i.id === req.params.id);

      if (!item) {
        return res.status(404).json({ error: "Content item not found." });
      }

      // If it is default and user wants to favourite it, we should copy it for this user or toggle a favourite action
      // Since our DB allows updating details, we can update it directly for JSON/Postgres.
      const updated = await db.contentItems.update(req.params.id, { is_favourite: !item.is_favourite });
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  getRecommended: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const habitId = req.params.habitId;
      const habit = await db.habits.findById(habitId);
      
      if (!habit || habit.user_id !== req.user.id) {
        return res.status(404).json({ error: "Habit not found." });
      }

      const allItems = await db.contentItems.findAll(req.user.id);
      const profile = await db.profiles.findByUserId(req.user.id);

      // Filtering logic
      // 1. Matches habit category
      let matches = allItems.filter(item => 
        item.category.toLowerCase() === habit.category.toLowerCase()
      );

      // 2. Fallback if no direct category match: filter by profile preferences
      if (matches.length === 0 && profile) {
        const types = profile.content_preferences.map(p => p.toLowerCase());
        matches = allItems.filter(item => 
          types.some(t => item.type.toLowerCase().includes(t) || item.title.toLowerCase().includes(t))
        );
      }

      // 3. Global defaults fallback
      if (matches.length === 0) {
        matches = allItems.filter(item => item.is_default);
      }

      return res.json(matches.slice(0, 4));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
