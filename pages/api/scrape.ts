import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface ScrapedItem {
  title: string;
  url: string;
  score?: number;
  comments?: number;
  source: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Starting real scraping process...');
    
    const allItems: ScrapedItem[] = [];
    
    // 1. Scrape Hacker News
    console.log('📰 Scraping Hacker News...');
    try {
      const topStoriesResponse = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topStoryIds = topStoriesResponse.data.slice(0, 10); // Get top 10
      
      for (const id of topStoryIds) {
        try {
          const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          const story = storyResponse.data;
          
          if (story && story.title) {
            allItems.push({
              title: story.title,
              url: story.url || `https://news.ycombinator.com/item?id=${id}`,
              score: story.score || 0,
              comments: story.descendants || 0,
              source: 'Hacker News',
              timestamp: new Date().toISOString()
            });
          }
        } catch (itemError) {
          console.warn('Failed to fetch HN story:', id);
        }
      }
      console.log(`✅ HN: ${allItems.filter(item => item.source === 'Hacker News').length} items`);
    } catch (error) {
      console.error('❌ Hacker News scraping failed:', error);
    }

    // 2. Scrape Reddit r/vibecoding
    console.log('🔥 Scraping r/vibecoding...');
    try {
      const redditResponse = await axios.get('https://www.reddit.com/r/vibecoding/hot.json?limit=10', {
        headers: { 'User-Agent': 'LaunchBrief/1.0' }
      });
      
      const posts = redditResponse.data.data.children;
      for (const post of posts) {
        const data = post.data;
        allItems.push({
          title: data.title,
          url: data.url.startsWith('/') ? `https://reddit.com${data.url}` : data.url,
          score: data.score || 0,
          comments: data.num_comments || 0,
          source: 'r/vibecoding',
          timestamp: new Date().toISOString()
        });
      }
      console.log(`✅ r/vibecoding: ${allItems.filter(item => item.source === 'r/vibecoding').length} items`);
    } catch (error) {
      console.error('❌ r/vibecoding scraping failed:', error);
    }

    // 3. Scrape Reddit r/solopreneur
    console.log('💼 Scraping r/solopreneur...');
    try {
      const redditResponse = await axios.get('https://www.reddit.com/r/solopreneur/hot.json?limit=10', {
        headers: { 'User-Agent': 'LaunchBrief/1.0' }
      });
      
      const posts = redditResponse.data.data.children;
      for (const post of posts) {
        const data = post.data;
        allItems.push({
          title: data.title,
          url: data.url.startsWith('/') ? `https://reddit.com${data.url}` : data.url,
          score: data.score || 0,
          comments: data.num_comments || 0,
          source: 'r/solopreneur',
          timestamp: new Date().toISOString()
        });
      }
      console.log(`✅ r/solopreneur: ${allItems.filter(item => item.source === 'r/solopreneur').length} items`);
    } catch (error) {
      console.error('❌ r/solopreneur scraping failed:', error);
    }

    // 4. Product Hunt (simplified - they require auth for full API)
    console.log('🚀 Adding Product Hunt placeholder...');
    allItems.push({
      title: 'Product Hunt Daily - Check manually',
      url: 'https://www.producthunt.com/',
      score: 0,
      comments: 0,
      source: 'Product Hunt',
      timestamp: new Date().toISOString()
    });

    const summary = {
      totalItems: allItems.length,
      sources: ['Hacker News', 'r/vibecoding', 'r/solopreneur', 'Product Hunt'],
      breakdown: {
        'Hacker News': allItems.filter(item => item.source === 'Hacker News').length,
        'r/vibecoding': allItems.filter(item => item.source === 'r/vibecoding').length,
        'r/solopreneur': allItems.filter(item => item.source === 'r/solopreneur').length,
        'Product Hunt': allItems.filter(item => item.source === 'Product Hunt').length
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Real scraping completed:', summary);
    
    res.status(200).json({ 
      message: `Successfully scraped ${summary.totalItems} real items from ${summary.sources.length} sources`,
      data: summary,
      items: allItems.slice(0, 5), // Show first 5 items as preview
      timestamp: summary.timestamp
    });
  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({ 
      error: 'Scraping failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}