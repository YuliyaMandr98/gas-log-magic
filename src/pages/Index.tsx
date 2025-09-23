import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FuelCalculator } from '@/components/FuelCalculator';
import { RefrigeratorTracker } from '@/components/RefrigeratorTracker';
import { FuelTankManager } from '@/components/FuelTankManager';
import Report from '@/components/Report';

const TABS_LS_KEY = 'mainTabs_selected';
const Index = () => {
  const [tab, setTab] = React.useState(() => {
    return localStorage.getItem(TABS_LS_KEY) || 'calculator';
  });
  const handleTabChange = (value: string) => {
    setTab(value);
    localStorage.setItem(TABS_LS_KEY, value);
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="calculator">Расчет расхода</TabsTrigger>
            <TabsTrigger value="refrigerator">Рефрижератор</TabsTrigger>
            <TabsTrigger value="tanks">Управление баками</TabsTrigger>
            <TabsTrigger value="report">Отчет</TabsTrigger>
          </TabsList>
          <TabsContent value="calculator">
            <FuelCalculator />
          </TabsContent>
          <TabsContent value="refrigerator">
            <RefrigeratorTracker />
          </TabsContent>
          <TabsContent value="tanks">
            <FuelTankManager />
          </TabsContent>
          <TabsContent value="report">
            <Report />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
