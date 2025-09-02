import React from "react";

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
      <ul className="flex flex-wrap -mb-px">
        {tabs.map((tab) => (
          <li key={tab} className="mr-2">
            <button
              onClick={() => onTabChange(tab)}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === tab
                  ? "text-indigo-600 dark:text-indigo-300 border-b-2 border-indigo-600 dark:border-indigo-300 font-semibold"
                  : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 text-gray-500 dark:text-gray-400"
              }`}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tabs;
