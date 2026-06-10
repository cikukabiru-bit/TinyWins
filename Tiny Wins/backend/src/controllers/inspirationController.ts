import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/db';

const inspirationSchema = z.object({
  text: z.string().min(1),
  author: z.string().optional().default('App Original'),
  source: z.string().optional(),
  type: z.string().default('quote'), // 'quote', 'reflection', 'verse', 'saint_quote', 'prompt'
  category: z.string().optional(),
  tone: z.string().default('Calm'),
  tags: z.array(z.string()).default([])
});

export const inspirationController = {
  getAll: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const items = await db.inspirationItems.findAll(req.user.id);

      // Enforce spiritual privacy filter even on bulk listings
      const profile = await db.profiles.findByUserId(req.user.id);
      const isSpiritualOptedIn = profile?.inspiration_preferences.some(p => 
        ['christian/bible verses', 'saint quotes', 'prayer prompts', 'mixed inspiration'].includes(p.toLowerCase())
      ) || profile?.primary_goal?.toLowerCase() === 'prayer/spirituality';

      let filteredItems = items;
      if (!isSpiritualOptedIn) {
        filteredItems = items.filter(item => 
          item.type !== 'verse' && 
          item.type !== 'saint_quote' && 
          !item.text.toLowerCase().includes('god') &&
          !item.text.toLowerCase().includes('bible') &&
          !item.text.toLowerCase().includes('lord') &&
          !item.tags.includes('prayer') &&
          !item.tags.includes('bible') &&
          !item.tags.includes('saint')
        );
      }

      return res.json(filteredItems);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch inspiration." });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const data = inspirationSchema.parse(req.body);
      const item = await db.inspirationItems.create({
        user_id: req.user.id,
        text: data.text,
        author: data.author || 'User Private',
        source: data.source,
        type: data.type,
        category: data.category,
        tone: data.tone,
        tags: data.tags,
        is_user_added: true,
        is_default: false,
        is_active: true,
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
      const target = await db.inspirationItems.findAll(req.user.id);
      const item = target.find(i => i.id === req.params.id);

      if (!item || item.user_id !== req.user.id) {
        return res.status(404).json({ error: "Inspiration not found or unauthorized." });
      }

      const updated = await db.inspirationItems.update(req.params.id, req.body);
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const target = await db.inspirationItems.findAll(req.user.id);
      const item = target.find(i => i.id === req.params.id);

      if (!item || item.user_id !== req.user.id) {
        return res.status(404).json({ error: "Inspiration not found or unauthorized." });
      }

      await db.inspirationItems.delete(req.params.id);
      return res.json({ message: "Inspiration deleted." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  favourite: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const target = await db.inspirationItems.findAll(req.user.id);
      const item = target.find(i => i.id === req.params.id);

      if (!item) return res.status(404).json({ error: "Inspiration not found." });

      const updated = await db.inspirationItems.update(req.params.id, { is_favourite: !item.is_favourite });
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  getRecommended: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { category, state } = req.query; // state can be 'missed', 'completed', etc.
      
      const allItems = await db.inspirationItems.findAll(req.user.id);
      const profile = await db.profiles.findByUserId(req.user.id);

      // 1. Determine spiritual permission
      const isSpiritualOptedIn = profile?.inspiration_preferences.some(p => 
        ['christian/bible verses', 'saint quotes', 'prayer prompts', 'mixed inspiration'].includes(p.toLowerCase())
      ) || profile?.primary_goal?.toLowerCase() === 'prayer/spirituality';

      let pool = allItems.filter(item => item.is_active);

      // Clean out spiritual if not opted in
      if (!isSpiritualOptedIn) {
        pool = pool.filter(item => 
          item.type !== 'verse' && 
          item.type !== 'saint_quote' && 
          !item.text.toLowerCase().includes('god') &&
          !item.text.toLowerCase().includes('bible') &&
          !item.text.toLowerCase().includes('lord') &&
          !item.tags.includes('prayer') &&
          !item.tags.includes('bible') &&
          !item.tags.includes('saint')
        );
      }

      // 2. Specific matching based on state (missed -> restart prompts)
      if (state === 'missed') {
        const restartItems = pool.filter(item => 
          item.tags.includes('restart') || 
          item.tags.includes('grace') ||
          item.text.toLowerCase().includes('begin') ||
          item.text.toLowerCase().includes('reset')
        );
        if (restartItems.length > 0) return res.json(restartItems[Math.floor(Math.random() * restartItems.length)]);
      }

      // 3. Category matching
      if (category) {
        const catItems = pool.filter(item => 
          item.category?.toLowerCase() === (category as string).toLowerCase() ||
          item.tags.includes((category as string).toLowerCase())
        );
        if (catItems.length > 0) return res.json(catItems[Math.floor(Math.random() * catItems.length)]);
      }

      // 4. Default: Select based on user tone or random from filtered pool
      const tone = profile?.coach_tone || 'Calm';
      const toneItems = pool.filter(item => item.tone?.toLowerCase() === tone.toLowerCase());
      
      const finalSelection = toneItems.length > 0 ? toneItems : pool;
      const randomItem = finalSelection[Math.floor(Math.random() * finalSelection.length)];

      return res.json(randomItem || { text: "Start where you are. Keep it small.", author: "App Original", tone: "Calm" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
