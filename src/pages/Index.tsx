import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FuelCalculator } from '@/components/FuelCalculator';
import { RefrigeratorTracker } from '@/components/RefrigeratorTracker';
import { FuelTankManager } from '@/components/FuelTankManager';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="calculator">Расчет расхода</TabsTrigger>
            <TabsTrigger value="refrigerator">Рефрижератор</TabsTrigger>
            <TabsTrigger value="tanks">Управление баками</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
