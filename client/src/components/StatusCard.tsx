import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
  changePercentage?: number;
  changeText?: string;
}

export function StatusCard({ 
  title, 
  value, 
  icon, 
  iconClassName,
  changePercentage, 
  changeText 
}: StatusCardProps) {
  const isPositive = changePercentage && changePercentage > 0;
  
  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-sm font-medium dark:text-gray-400 truncate">{title}</p>
            <h3 className="text-2xl font-bold mt-2 truncate">{value}</h3>
            {(changePercentage !== undefined && changeText) && (
              <div className="flex items-center text-sm mt-2 flex-wrap">
                <span className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  <i className={`${isPositive ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1`}></i>
                  {Math.abs(changePercentage)}%
                </span>
                <span className="text-gray-500 ml-2 dark:text-gray-400 truncate">{changeText}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconClassName}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
