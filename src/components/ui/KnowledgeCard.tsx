import React from 'react';
import { ModernButton } from './ModernButton';

interface KnowledgeCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  title = "Increase your Knowledge",
  subtitle = "By Learning!",
  description = "We have new method to learn. learning process. More faster, secure and easy to use!",
  buttonText = "OK! Take me there",
  onButtonClick
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <h4 className="text-lg mb-4">{subtitle}</h4>
      <p className="text-sm mb-6 opacity-90">
        {description}
      </p>
      <ModernButton 
        variant="solid"
        onClick={onButtonClick}
        className="bg-white text-purple-600 hover:bg-gray-100 focus:ring-white"
      >
        {buttonText}
      </ModernButton>
      
      {/* Decorative elements */}
      <div className="mt-4 opacity-20">
        <svg viewBox="0 0 200 100" className="w-full h-16">
          <path d="M20,80 Q50,20 80,40 T140,30 T200,60" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="60" cy="35" r="4" fill="white"/>
          <circle cx="120" cy="25" r="3" fill="white"/>
          <circle cx="160" cy="45" r="2" fill="white"/>
        </svg>
      </div>
    </div>
  );
};
