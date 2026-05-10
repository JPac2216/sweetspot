import authRoutes from './auth.js';
import dateRoutes from './dates.js';
import spotRoutes from './spots.js';
import userRoutes from './users.js';
import adminRoutes from './admin.js';

const constructorMethod = (app) => {
  app.use('/', authRoutes);
  app.use('/', userRoutes);
  app.use('/date', dateRoutes);
  app.use('/spots', spotRoutes);
  app.use('/admin', adminRoutes);

  app.use((req, res) => {
    return res.status(404).render('error', {
      title: 'Error',
      error: 'Page not found'
    });
  });
};

export default constructorMethod;
