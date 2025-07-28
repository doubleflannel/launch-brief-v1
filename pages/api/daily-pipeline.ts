import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting daily pipeline...');
    
    const results = {
      scrape: null as any,
      summarise: null as any,
      send: null as any,
      startTime: new Date().toISOString(),
      endTime: null as string | null,
      duration: null as number | null
    };

    // Step 1: Scrape
    console.log('📊 Step 1: Scraping sources...');
    try {
      const scrapeResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.scrape = await scrapeResponse.json();
      console.log('✅ Scraping completed');
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      results.scrape = { error: 'Scraping failed' };
    }

    // Step 2: Summarise
    console.log('🤖 Step 2: Generating newsletter...');
    try {
      const summariseResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/summarise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.summarise = await summariseResponse.json();
      console.log('✅ Newsletter generated');
    } catch (error) {
      console.error('❌ Newsletter generation failed:', error);
      results.summarise = { error: 'Newsletter generation failed' };
    }

    // Step 3: Send
    console.log('📧 Step 3: Sending newsletter...');
    try {
      const sendResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.send = await sendResponse.json();
      console.log('✅ Newsletter sent');
    } catch (error) {
      console.error('❌ Newsletter sending failed:', error);
      results.send = { error: 'Newsletter sending failed' };
    }

    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime).getTime() - new Date(results.startTime).getTime();

    console.log('🎉 Daily pipeline completed in', results.duration, 'ms');

    res.status(200).json({
      message: 'Daily pipeline completed successfully',
      results,
      timestamp: results.endTime
    });

  } catch (error) {
    console.error('❌ Daily pipeline error:', error);
    res.status(500).json({
      error: 'Daily pipeline failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}