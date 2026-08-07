import { Response } from 'express';
import { Guest } from '../models/guest.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { logAdminAction } from '../services/audit.service';

export const getGuests = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guests = await Guest.find().populate('eventId', 'title');
    res.status(200).json(guests);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve guests.' });
  }
};

export const createGuest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, organization, designation, eventId, status } = req.body;

    if (!name || !email || !eventId) {
      res.status(400).json({ error: 'Name, email, and associated Event are required.' });
      return;
    }

    const newGuest = new Guest({
      name,
      email,
      organization,
      designation,
      eventId,
      status: status || 'invited'
    });

    await newGuest.save();

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'CREATE_GUEST',
        { guestId: newGuest._id, name: newGuest.name },
        req.ip || 'unknown'
      );
    }

    res.status(201).json(newGuest);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add guest.' });
  }
};

export const updateGuest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, organization, designation, eventId, status } = req.body;

    const guest = await Guest.findById(id);
    if (!guest) {
      res.status(404).json({ error: 'Guest speaker not found.' });
      return;
    }

    if (name) guest.name = name;
    if (email) guest.email = email;
    if (organization !== undefined) guest.organization = organization;
    if (designation !== undefined) guest.designation = designation;
    if (eventId) guest.eventId = eventId;
    if (status) guest.status = status;

    await guest.save();

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'UPDATE_GUEST',
        { guestId: guest._id, name: guest.name },
        req.ip || 'unknown'
      );
    }

    res.status(200).json(guest);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update guest profile.' });
  }
};

export const deleteGuest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const guest = await Guest.findById(id);

    if (!guest) {
      res.status(404).json({ error: 'Guest speaker not found.' });
      return;
    }

    await Guest.deleteOne({ _id: id });

    if (req.user) {
      await logAdminAction(
        req.user.id,
        req.user.username,
        'DELETE_GUEST',
        { guestId: id, name: guest.name },
        req.ip || 'unknown'
      );
    }

    res.status(200).json({ message: 'Guest speaker removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove guest.' });
  }
};
