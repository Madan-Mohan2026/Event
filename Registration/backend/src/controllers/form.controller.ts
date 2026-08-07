import { Response } from 'express';
import { Form } from '../models/Form';
import { Event } from '../models/event.model';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/forms — List all standalone forms + event forms
export const getForms = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const standaloneForms = await Form.find().sort({ createdAt: -1 }).lean();
    const eventsWithForms = await Event.find({ formSchema: { $exists: true, $not: { $size: 0 } } })
      .select('title description formSchema category date createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Map standalone forms
    const formattedStandalone = standaloneForms.map(f => ({
      ...f,
      isStandalone: true,
      formSchema: (f.formSchema && f.formSchema.length > 0) ? f.formSchema : (f.fields || []),
      regsCount: f.regsCount || f.responsesCount || 0
    }));

    // Map events with forms
    const formattedEvents = eventsWithForms.map(e => ({
      ...e,
      isStandalone: false,
      formSchema: e.formSchema || [],
      fields: e.formSchema || [],
      regsCount: 0
    }));

    // Combine avoiding duplicates
    const combined = [...formattedStandalone];
    for (const ef of formattedEvents) {
      if (!combined.some(c => String(c._id) === String(ef._id))) {
        combined.push(ef);
      }
    }

    // Sort newest created forms first so newly created forms always appear in the first row
    combined.sort((a, b) => {
      const timeA = new Date((a as any).createdAt || 0).getTime();
      const timeB = new Date((b as any).createdAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return String((b as any)._id || '').localeCompare(String((a as any)._id || ''));
    });

    res.status(200).json(combined);
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

    const initialSchema = formSchema || fields || [
      { name: 'participantName', label: 'Full Name', fieldType: 'short_text', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'participantEmail', label: 'Email Address', fieldType: 'email', type: 'email', required: true, placeholder: 'name@example.com' },
      { name: 'participantPhone', label: 'Phone Number', fieldType: 'phone', type: 'text', required: false, placeholder: '+91 9876543210' }
    ];

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
