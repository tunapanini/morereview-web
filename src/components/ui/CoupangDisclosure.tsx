import React from 'react';

const CoupangDisclosure: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
      <p className="text-xs text-blue-800 text-center">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </div>
  );
};

export default CoupangDisclosure;
