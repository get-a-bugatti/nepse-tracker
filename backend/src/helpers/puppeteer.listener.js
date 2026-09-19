// Listens for specific API call (POST on /api/nots/security/<targetId>) during
// Headless's browser scraping.

export async function shareDetailListener(page, targetId) {
  return page.waitForResponse(
    (response) => {
      return (
        response.url().includes(`/api/nots/security/${targetId}`) &&
        response.status() === 200
      );
    },
    {
      timeout: 15000,
    }
  );
}
