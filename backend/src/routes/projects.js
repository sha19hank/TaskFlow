const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const userSelect = { id: true, name: true, email: true };

// GET /api/projects - All projects for current user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        owner: { select: userSelect },
        members: {
          include: { user: { select: userSelect } },
          orderBy: { joinedAt: 'asc' }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects - Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: 'Project name is required' });

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'ADMIN' } }
      },
      include: {
        owner: { select: userSelect },
        members: { include: { user: { select: userSelect } } },
        _count: { select: { tasks: true } }
      }
    });
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id - Single project with tasks
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        owner: { select: userSelect },
        members: {
          include: { user: { select: userSelect } },
          orderBy: { joinedAt: 'asc' }
        },
        tasks: {
          include: {
            assignee: { select: userSelect },
            createdBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(m => m.userId === req.user.id);
    const userRole = project.ownerId === req.user.id ? 'ADMIN' : (member?.role || 'MEMBER');

    res.json({ ...project, userRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id - Update project (owner/admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id, role: 'ADMIN' } } }
        ]
      }
    });
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    const { name, description } = req.body;
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null })
      }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id - Delete project (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, ownerId: req.user.id }
    });
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/members - Add member
router.post('/:id/members', auth, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id, role: 'ADMIN' } } }
        ]
      }
    });
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ message: 'User not found with that email' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: userToAdd.id } }
    });
    if (existing) return res.status(400).json({ message: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        userId: userToAdd.id,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
      },
      include: { user: { select: userSelect } }
    });
    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove member
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id, role: 'ADMIN' } } }
        ]
      }
    });
    if (!project) return res.status(403).json({ message: 'Not authorized' });

    if (req.params.userId === project.ownerId)
      return res.status(400).json({ message: 'Cannot remove the project owner' });

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } }
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
