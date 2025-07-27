import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';

interface APIStatus {
  scrape: 'idle' | 'running' | 'success' | 'error';
  summarise: 'idle' | 'running' | 'success' | 'error';
  send: 'idle' | 'running' | 'success' | 'error';
}

interface LogEntry {
  timestamp: string;
  endpoint: string;
  status: 'success' | 'error';
  message: string;
}

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState<APIStatus>({
    scrape: 'idle',
    summarise: 'idle',
    send: 'idle'
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastNewsletter, setLastNewsletter] = useState<string>('');

  const addLog = (endpoint: string, status: 'success' | 'error', message: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleString(),
      endpoint,
      status,
      message
    };
    setLogs(prev => [newLog, ...prev.slice(0, 9)]); // Keep last 10 logs
  };

  const runAPI = async (endpoint: string) => {
    setApiStatus(prev => ({ ...prev, [endpoint]: 'running' }));
    
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setApiStatus(prev => ({ ...prev, [endpoint]: 'success' }));
        addLog(endpoint, 'success', data.message || 'Operation completed successfully');
        
        // If it's summarise, try to get the newsletter content
        if (endpoint === 'summarise' && data.newsletter) {
          setLastNewsletter(data.newsletter);
        }
      } else {
        throw new Error(data.error || 'API call failed');
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, [endpoint]: 'error' }));
      addLog(endpoint, 'error', error instanceof Error ? error.message : 'Unknown error');
    }

    // Reset status after 3 seconds
    setTimeout(() => {
      setApiStatus(prev => ({ ...prev, [endpoint]: 'idle' }));
    }, 3000);
  };

  const runFullPipeline = async () => {
    await runAPI('scrape');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await runAPI('summarise');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await runAPI('send');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#ffa500';
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  return (
    <>
      <Head>
        <title>Launch Brief - Dashboard</title>
        <meta name="description" content="Launch Brief Newsletter Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1>🚀 Launch Brief Dashboard</h1>
          <p>Daily newsletter automation control center</p>
        </header>

        <div className={styles.grid}>
          {/* Pipeline Control */}
          <div className={styles.card}>
            <h2>📊 Pipeline Control</h2>
            <div className={styles.pipeline}>
              <div className={styles.step}>
                <span className={styles.icon} style={{ color: getStatusColor(apiStatus.scrape) }}>
                  {getStatusIcon(apiStatus.scrape)}
                </span>
                <span>Scrape Sources</span>
                <button 
                  onClick={() => runAPI('scrape')}
                  disabled={apiStatus.scrape === 'running'}
                  className={styles.button}
                >
                  {apiStatus.scrape === 'running' ? 'Running...' : 'Run Scrape'}
                </button>
              </div>
              
              <div className={styles.arrow}>↓</div>
              
              <div className={styles.step}>
                <span className={styles.icon} style={{ color: getStatusColor(apiStatus.summarise) }}>
                  {getStatusIcon(apiStatus.summarise)}
                </span>
                <span>Generate Summary</span>
                <button 
                  onClick={() => runAPI('summarise')}
                  disabled={apiStatus.summarise === 'running'}
                  className={styles.button}
                >
                  {apiStatus.summarise === 'running' ? 'Running...' : 'Run Summary'}
                </button>
              </div>
              
              <div className={styles.arrow}>↓</div>
              
              <div className={styles.step}>
                <span className={styles.icon} style={{ color: getStatusColor(apiStatus.send) }}>
                  {getStatusIcon(apiStatus.send)}
                </span>
                <span>Send Email</span>
                <button 
                  onClick={() => runAPI('send')}
                  disabled={apiStatus.send === 'running'}
                  className={styles.button}
                >
                  {apiStatus.send === 'running' ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
            
            <button 
              onClick={runFullPipeline}
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={Object.values(apiStatus).some(status => status === 'running')}
            >
              🚀 Run Full Pipeline
            </button>
          </div>

          {/* System Status */}
          <div className={styles.card}>
            <h2>⚡ System Status</h2>
            <div className={styles.status}>
              <div className={styles.statusItem}>
                <span>Next Scheduled Run:</span>
                <span className={styles.time}>Tomorrow 7:00 AM ET</span>
              </div>
              <div className={styles.statusItem}>
                <span>Environment:</span>
                <span className={styles.env}>{process.env.NODE_ENV || 'development'}</span>
              </div>
              <div className={styles.statusItem}>
                <span>Last Activity:</span>
                <span className={styles.time}>
                  {logs.length > 0 ? logs[0].timestamp : 'No activity yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className={styles.card}>
            <h2>📝 Activity Logs</h2>
            <div className={styles.logs}>
              {logs.length === 0 ? (
                <div className={styles.emptyLogs}>No activity logged yet</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`${styles.logEntry} ${styles[log.status]}`}>
                    <div className={styles.logTime}>{log.timestamp}</div>
                    <div className={styles.logEndpoint}>{log.endpoint}</div>
                    <div className={styles.logMessage}>{log.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Newsletter Preview */}
          <div className={styles.card}>
            <h2>📧 Latest Newsletter</h2>
            <div className={styles.newsletter}>
              {lastNewsletter ? (
                <div className={styles.newsletterContent}>
                  <pre>{lastNewsletter}</pre>
                </div>
              ) : (
                <div className={styles.emptyNewsletter}>
                  No newsletter generated yet. Run the summarise step to see content here.
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <p>Launch Brief © 2025 | Automated Newsletter System</p>
        </footer>
      </div>
    </>
  );
}