// En tu servidor backend (api/ejecutar-webhook)
router.post('/ejecutar-webhook', async (req, res) => {
  try {
    const response = await fetch(
      "https://n8n-torta-express.qnfmlx.easypanel.host/webhook/44ccd0ac-cab7-45f8-aa48-317e9400ca2d",
      { method: "POST" }
    );
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});