// DomainUsageExample.jsx
// Example showing how to use the useDomain hook in any component

import { useDomain } from '../contexts/DomainContext';

export default function DomainUsageExample() {
  // Get domain information anywhere in your app
  const { domainInfo, isDomain, getTargetDomain, isEasyBroker, isBase, isLocal } = useDomain();

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Domain Context Usage Example</h3>

      <div style={{ marginTop: '15px' }}>
        <h4>Domain Information:</h4>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(domainInfo, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h4>Helper Functions:</h4>
        <ul>
          <li>isDomain('easybroker'): {isDomain('easybroker') ? 'true' : 'false'}</li>
          <li>isDomain('base'): {isDomain('base') ? 'true' : 'false'}</li>
          <li>isDomain('local'): {isDomain('local') ? 'true' : 'false'}</li>
          <li>getTargetDomain(): {getTargetDomain()}</li>
        </ul>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h4>Convenience Properties:</h4>
        <ul>
          <li>isEasyBroker: {isEasyBroker ? 'true' : 'false'}</li>
          <li>isBase: {isBase ? 'true' : 'false'}</li>
          <li>isLocal: {isLocal ? 'true' : 'false'}</li>
        </ul>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h4>Conditional Rendering Example:</h4>
        {isEasyBroker && (
          <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '4px' }}>
            🏠 You are on the EasyBroker domain!
          </div>
        )}
        {isBase && (
          <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '4px' }}>
            🏠 You are on the Base domain!
          </div>
        )}
        {isLocal && (
          <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '4px' }}>
            💻 You are in local development!
          </div>
        )}
      </div>
    </div>
  );
}
