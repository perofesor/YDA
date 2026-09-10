'use strict';
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const auth = require('../controllers/auth.controller');
const settings = require('../controllers/settings.controller');
const content = require('../controllers/content.controller');
const leads = require('../controllers/leads.controller');
const dashboard = require('../controllers/dashboard.controller');
const media = require('../controllers/media.controller');

// Rate limiter for public submissions
const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'تعداد درخواست بیش از حد مجاز. کمی بعد تلاش کنید.' },
});

/* =========================================================
 *  AUTH
 * ======================================================= */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
router.post('/auth/login', loginLimiter, auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', requireAuth, auth.me);
router.post('/auth/change-password', requireAuth, auth.changePassword);
router.put('/auth/profile', requireAuth, auth.updateProfile);

/* =========================================================
 *  PUBLIC ENDPOINTS
 * ======================================================= */
router.get('/settings', settings.getPublic);
router.get('/categories', content.listCategories);
router.get('/projects', content.listProjects);
router.get('/projects/:idOrSlug', content.getProject);
router.get('/posts', content.listPosts);
router.get('/posts/:idOrSlug', content.getPost);
router.get('/services', content.listServices);

// Public form submissions (with file upload support)
router.post('/requests', submitLimiter, upload.array('files', 10), leads.submitRequest);
router.post('/collaborations', submitLimiter, upload.array('files', 3), leads.submitCollaboration);
router.post('/messages', submitLimiter, leads.submitMessage);
router.post('/track', dashboard.track);

/* =========================================================
 *  ADMIN ENDPOINTS (auth required)
 * ======================================================= */
const admin = express.Router();
admin.use(requireAuth);

admin.get('/dashboard', dashboard.stats);
admin.get('/analytics', dashboard.analytics);

// Settings
admin.get('/settings', settings.getAll);
admin.put('/settings', settings.update);
admin.post('/settings/reset', settings.resetSettings);

// Categories
admin.post('/categories', content.createCategory);
admin.put('/categories/:id', content.updateCategory);
admin.delete('/categories/:id', content.deleteCategory);

// Projects
admin.get('/projects', content.listProjects);
admin.post('/projects', content.createProject);
admin.put('/projects/:id', content.updateProject);
admin.delete('/projects/:id', content.deleteProject);

// Posts
admin.get('/posts', content.listPosts);
admin.post('/posts', content.createPost);
admin.put('/posts/:id', content.updatePost);
admin.delete('/posts/:id', content.deletePost);

// Services
admin.post('/services', content.createService);
admin.put('/services/:id', content.updateService);
admin.delete('/services/:id', content.deleteService);

// Requests (CRM)
admin.get('/requests', leads.listRequests);
admin.get('/requests/:id', leads.getRequest);
admin.put('/requests/:id', leads.updateRequest);
admin.delete('/requests/:id', leads.deleteRequest);

// Collaborations
admin.get('/collaborations', leads.listCollaborations);
admin.put('/collaborations/:id', leads.updateCollaboration);
admin.delete('/collaborations/:id', leads.deleteCollaboration);

// Messages
admin.get('/messages', leads.listMessages);
admin.put('/messages/:id', leads.updateMessage);
admin.delete('/messages/:id', leads.deleteMessage);

// Media
admin.post('/media/upload', upload.array('files', 20), media.upload);
admin.get('/media', media.list);
admin.delete('/media/:id', media.remove);

router.use('/admin', admin);

module.exports = router;
