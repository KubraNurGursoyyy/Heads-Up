export default {
  async scheduled(event, env, ctx) {
    const baseUrl = env.API_URL.replace(/\/$/, '');
    const path = event.cron === '0 * * * *' ? '/internal/policy-check' : '/internal/scan';

    ctx.waitUntil(
      fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'X-HeadsUp-Cron-Secret': env.HEADSUP_CRON_SECRET,
        },
      }).then(async response => {
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`${path} failed: ${response.status} ${body}`);
        }
      }),
    );
  },
};
