import { Router } from 'express';
import * as c from '../controllers/adminController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT, requireRole('admin'));

router.get('/overview/stats', c.getOverviewStats);
router.get('/analytics/orders', c.getOrderAnalytics);
router.get('/orders/recent', c.getRecentOrders);
router.get('/orders/stats', c.getAdminOrderStats);
router.patch('/orders/:id/status', c.adminUpdateOrderStatus);
router.delete('/orders/:id', c.adminDeleteOrder);

router.get('/dashboard', c.dashboard);
router.get('/farmers/pending', c.pendingFarmers);
router.patch('/farmers/:id/approve', c.approveFarmer);
router.patch('/farmers/:id/suspend', c.suspendFarmer);

router.get('/farmers', c.getFarmers);
router.patch('/farmers/:id/status', c.updateFarmerStatus);
router.delete('/farmers/:id', c.deleteFarmerUser);

router.patch('/customers/:id/status', c.setCustomerStatus);
router.delete('/products/:id', c.removeProduct);
// Customer
router.get('/customers', c.getCustomers);
router.get('/customers/stats', c.getCustomerStats);
router.patch('/customers/:id/status', c.updateCustomerStatus);
router.delete('/customers/:id', c.deleteCustomerUser);

router.get('/products', c.getAdminProducts);
router.get('/products/stats', c.getAdminProductStats);
router.patch('/products/:id/moderation', c.updateProductModeration);

router.get('/reviews', c.getAdminReviews);
router.get('/reviews/stats', c.getAdminReviewStats);
router.patch('/reviews/:id/status', c.updateReviewStatus);
router.delete('/reviews/:id', c.deleteAdminReview);

router.get('/reports/summary', c.getReportsSummary);
router.get('/reports/revenue-by-market', c.getRevenueByMarket);
router.get('/reports/top-farmers', c.getTopFarmers);

router.get('/announcements', c.getAnnouncements);
router.get('/announcements/stats', c.getAnnouncementStats);
router.post('/announcements', c.createAnnouncement);
router.patch('/announcements/:id', c.updateAnnouncement);
router.patch('/announcements/:id/status', c.updateAnnouncementStatus);
router.delete('/announcements/:id', c.deleteAnnouncement);

router.get('/markets', c.getAdminMarkets);
router.get('/markets/stats', c.getAdminMarketStats);
router.patch('/markets/:id/status', c.updateMarketStatus);
export default router;