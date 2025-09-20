export default function NotificationSettings({ 
  permission, 
  isEnabled, 
  setIsEnabled, 
  requestPermission 
}) {
  const handleToggle = async () => {
    if (!isEnabled) {
      // 通知を有効にする場合、許可を要求
      const granted = await requestPermission()
      if (granted) {
        setIsEnabled(true)
      }
    } else {
      // 通知を無効にする場合
      setIsEnabled(false)
    }
  }

  const getStatusText = () => {
    if (permission === 'denied') {
      return '通知が拒否されています。ブラウザの設定で許可してください。'
    }
    if (permission === 'default') {
      return '通知の許可が必要です。'
    }
    if (permission === 'granted' && isEnabled) {
      return '✅ 通知が有効です（ブラウザを閉じていても通知されます）'
    }
    if (permission === 'granted' && !isEnabled) {
      return '通知が無効です。'
    }
    return ''
  }

  const getStatusColor = () => {
    if (permission === 'denied') return '#e55'
    if (permission === 'default') return '#f90'
    if (isEnabled) return '#4caf50'
    return '#666'
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      color: '#fff',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '1.3rem' }}>
        🔔 通知設定
      </h4>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 16, 
        marginBottom: 12 
      }}>
        <button
          onClick={handleToggle}
          disabled={permission === 'denied'}
          style={{
            background: isEnabled ? '#4caf50' : '#ff6b6b',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: permission === 'denied' ? 'not-allowed' : 'pointer',
            opacity: permission === 'denied' ? 0.6 : 1,
            transition: 'all 0.3s ease',
            minWidth: '120px'
          }}
          onMouseOver={(e) => {
            if (permission !== 'denied') {
              e.target.style.transform = 'scale(1.05)'
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          {isEnabled ? '🔔 通知ON' : '🔕 通知OFF'}
        </button>
        
        <div style={{ 
          fontSize: '1rem',
          fontWeight: '500'
        }}>
          {isEnabled ? '通知を受け取ります' : '通知を受け取りません'}
        </div>
      </div>

      <div style={{ 
        fontSize: '0.95rem', 
        color: isEnabled ? '#e8f5e8' : '#ffebee',
        marginTop: 8,
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 6
      }}>
        {getStatusText()}
      </div>

      {permission === 'denied' && (
        <div style={{ 
          fontSize: '0.9rem', 
          color: '#fff', 
          marginTop: 12,
          padding: 12,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <strong>🔧 通知を有効にする方法：</strong><br />
          1. ブラウザのアドレスバー左側の🔔アイコンをクリック<br />
          2. 「許可」を選択<br />
          3. ページを再読み込み
        </div>
      )}

      <div style={{ 
        fontSize: '0.9rem', 
        color: 'rgba(255,255,255,0.9)', 
        marginTop: 12,
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 6
      }}>
        <strong>📋 通知の仕様：</strong><br />
        • 予定の5分前と予定時間に通知されます<br />
        • ブラウザを閉じていても通知が届きます<br />
        • 通知をクリックするとアプリが開きます
      </div>
    </div>
  )
}
