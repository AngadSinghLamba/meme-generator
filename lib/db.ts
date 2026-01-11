import { init, id } from '@instantdb/react';
import schema from '../instant.schema';

const APP_ID = '9365d762-bda6-4928-80c2-14e1d0e64bc2';

export const db = init({
  appId: APP_ID,
  schema,
});

// Export id function for generating IDs
export { id };