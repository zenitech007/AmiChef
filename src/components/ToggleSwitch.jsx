import React from 'react';

const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`${enabled ? 'bg-secondary-green' : 'bg-gray-300'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50`}>
    <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
  </button>
);

export default ToggleSwitch;
