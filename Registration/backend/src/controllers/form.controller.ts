import { Response } from 'express';
import { Form } from '../models/Form';
import { Event } from '../models/event.model';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/forms — List all standalone forms created by Super Admin (No auto-generated event form duplicates)
export const getForms = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const standaloneForms = await Form.find().sort({ createdAt: -1 }).lean();
    const allEvents = await Event.find()
      .select('title assignedFormId')
      .lean();

    // Set of form IDs that are assigned to an event
    const assignedFormIdsSet = new Set<string>();
    for (const evt of allEvents) {
      if (evt.assignedFormId && String(evt.assignedFormId).trim() !== '') {
        assignedFormIdsSet.add(String(evt.assignedFormId).trim());
      }
    }

    // Map standalone forms created strictly by the Super Admin
    const formattedStandalone = standaloneForms.map(f => {
      const formIdStr = String(f._id);
      const isAssigned = assignedFormIdsSet.has(formIdStr) || (f as any).isAssigned === true;
      return {
        ...f,
        isStandalone: true,
        isAssigned,
        assignedFormId: isAssigned ? (f as any).assignedFormId || formIdStr : '',
        formSchema: (f.formSchema && f.formSchema.length > 0) ? f.formSchema : (f.fields || []),
        regsCount: f.regsCount || f.responsesCount || 0
      };
    });

    res.status(200).json(formattedStandalone);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch forms.' });
  }
};

// POST /api/forms — Create a standalone Form (Does NOT create an event card on #events!)
export const createForm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, formSchema, fields } = req.body;

    if (!title || title.trim() === '') {
      res.status(400).json({ error: 'Form title is required.' });
      return;
    }

    const initialSchema = formSchema || fields || [];

    const newForm = new Form({
      title: title.trim(),
      description: description || '',
      formSchema: initialSchema,
      fields: initialSchema,
      regsCount: 0
    });

    await newForm.save();
    res.status(201).json(newForm);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create form.' });
  }
};

// GET /api/forms/:id — Fetch a specific form
export const getFormById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let formObj: any = await Form.findById(id).lean();

    if (!formObj) {
      const evt = await Event.findById(id).lean();
      if (evt) {
        formObj = {
          ...evt,
          isStandalone: false,
          formSchema: evt.formSchema || []
        };
      }
    }

    if (!formObj) {
      res.status(404).json({ error: 'Form not found.' });
      return;
    }

    res.status(200).json(formObj);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch form.' });
  }
};

// PUT /api/forms/:id — Update form title, description, and form schema
export const updateForm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, formSchema, fields } = req.body;

    const schemaToSave = formSchema || fields || [];

    let formObj = await Form.findById(id);
    if (formObj) {
      if (title && title.trim()) formObj.title = title.trim();
      if (description !== undefined) formObj.description = description;
      if (schemaToSave) {
        formObj.formSchema = schemaToSave;
        formObj.fields = schemaToSave;
      }
      await formObj.save();
      res.status(200).json(formObj);
      return;
    }

    // Fallback: If updating an event form
    const evt = await Event.findById(id);
    if (evt) {
      if (schemaToSave) evt.formSchema = schemaToSave;
      await evt.save();
      res.status(200).json(evt);
      return;
    }

    res.status(404).json({ error: 'Form not found.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update form.' });
  }
};

// DELETE /api/forms/:id — Delete standalone form
export const deleteForm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Form.findByIdAndDelete(id);

    if (!deleted) {
      // If it's an event form, clear formSchema instead of deleting event
      const evt = await Event.findById(id);
      if (evt) {
        evt.formSchema = [];
        await evt.save();
      }
    }

    res.status(200).json({ message: 'Form deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete form.' });
  }
};
