import React from 'react';

export function FranLumiLogo({size=24,...props}){
 return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="franlumi-logo" aria-hidden="true" {...props}>
  <circle cx="16" cy="14" r="6.6"/>
  <path d="M16 1.1v3.6M9.55 2.83l1.8 3.12M4.83 7.55l3.12 1.8M3.1 14h3.6M25.3 14h3.6M24.05 9.35l3.12-1.8M20.65 5.95l1.8-3.12"/>
  <path d="M8 20.5c4.4 5.28 11.6 5.28 16 0a8.13 9.756 0 0 1-16 0Z"/>
 </svg>;
}
