import { Item } from '../models/Item.js';

export async function listItems(req, res, next) {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createItem(req, res, next) {
  try {
    const item = await Item.create({ title: req.body.title });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function toggleItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.completed = !item.completed;
    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}


