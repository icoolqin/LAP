const express = require('express');
const { fetchAllHotItems } = require('./apiClient');
const { saveHotItems } = require('./dbOperations');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/update-hot-items', async (req, res) => {
  console.log('Received request to /update-hot-items');
  try {
    console.log('Fetching trending topics...');
    const items = await fetchAllHotItems();
    console.log(`Fetched ${items.length} trending topics`);
    
    console.log('Saving trending topics to database...');
    await saveHotItems(items);
    console.log('Trending topics saved successfully');
    
    res.json({ message: `Successfully updated ${items.length} trending topics.` });
  } catch (error) {
    console.error('Error updating trending topics:', error);
    res.status(500).json({ error: 'An error occurred while updating trending topics.', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
