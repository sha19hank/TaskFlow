const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const projectFilter = {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    };

    const taskFilter = {
      project: projectFilter
    };

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByStatus,
      recentTasks,
      myTasks
    ] = await Promise.all([
      prisma.project.count({ where: projectFilter }),

      prisma.task.count({ where: taskFilter }),

      prisma.task.count({ where: { ...taskFilter, status: 'DONE' } }),

      prisma.task.count({
        where: {
          ...taskFilter,
          dueDate: { lt: new Date() },
          status: { not: 'DONE' }
        }
      }),

      prisma.task.groupBy({
        by: ['status'],
        where: taskFilter,
        _count: { _all: true }
      }),

      prisma.task.findMany({
        where: taskFilter,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),

      prisma.task.findMany({
        where: { ...taskFilter, assigneeId: userId, status: { not: 'DONE' } },
        include: {
          project: { select: { id: true, name: true } }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      })
    ]);

    const statusMap = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    tasksByStatus.forEach(s => { statusMap[s.status] = s._count._all; });

    res.json({
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByStatus: statusMap,
      recentTasks,
      myTasks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
