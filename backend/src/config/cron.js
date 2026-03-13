const cron = require('node-cron');
const db = require('./db');
const notificationsService = require('../modules/notifications/notifications.service');

const initCron = () => {
  // Ejecutar todos los días a las 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Ejecutando tarea programada: Verificación de cuentas vencidas');
    await checkOverdueAccounts();
  });

  // Para pruebas inmediatas (opcional - comentar en prod)
  // cron.schedule('*/5 * * * *', async () => {
  //   console.log('Prueba de cron cada 5 minutos');
  //   await checkOverdueAccounts();
  // });
};

const checkOverdueAccounts = async () => {
  try {
    // Buscar cuentas con balance positivo donde el tiempo desde la última actualización 
    // (o el último movimiento) supere el límite de días configurado.
    const query = `
      SELECT 
        ca.id as account_id,
        ca.current_balance,
        ca.overdue_days_limit,
        ca.updated_at as last_activity,
        c.id as customer_id,
        c.name as customer_name,
        c.branch_id
      FROM customer_accounts ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE ca.current_balance > 0 
        AND c.deleted_at IS NULL
        AND (CURRENT_TIMESTAMP - ca.updated_at) > (ca.overdue_days_limit || ' days')::interval
    `;

    const { rows: overdueAccounts } = await db.query(query);

    for (const account of overdueAccounts) {
      await notificationsService.createNotification({
        type: 'OVERDUE_ACCOUNT',
        title: 'Cuenta Corriente Vencida',
        message: `El cliente "${account.customer_name}" tiene una deuda de $${account.current_balance} que ha superado el límite de ${account.overdue_days_limit} días sin actividad.`,
        related_id: account.customer_id,
        branch_id: account.branch_id
      });
    }

    if (overdueAccounts.length > 0) {
      console.log(`Se generaron ${overdueAccounts.length} notificaciones de cuentas vencidas.`);
    }
  } catch (error) {
    console.error('Error en checkOverdueAccounts:', error);
  }
};

module.exports = { initCron };
