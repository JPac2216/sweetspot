import authRoutes from './auth.js';
import dateRoutes from './dates.js';
import spotRoutes from './spots.js';
import userRoutes from './users.js';

const constructorMethod = (app) => {
  app.use('/', authRoutes);
  app.use('/user', userRoutes);
  app.use('/date', dateRoutes);
  app.use('/spot', spotRoutes);

  app.use('*', (req, res) => {
    return res.status(404).render('error', {
      title: 'Error',
      error: 'Page not found'
    });
  });
};

export default constructorMethod;
