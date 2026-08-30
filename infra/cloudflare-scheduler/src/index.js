export default {
  async scheduled(_event, env, ctx) {
    const baseUrl = env.API_URL.replace(/\/$/, '');

    ctx.waitUntil(
      fetch(`${baseUrl}/internal/scan`, {
        method: 'POST',
        headers: {
          'X-HeadsUp-Cron-Secret': env.HEADSUP_CRON_SECRET,
        },
      }).then(async response => {
        if (!response.ok) {
          const body = await response.text();

          throw new Error(
            `/internal/scan failed: ${response.status} ${body}`,
          );
        }
      }),
    );
  },
};