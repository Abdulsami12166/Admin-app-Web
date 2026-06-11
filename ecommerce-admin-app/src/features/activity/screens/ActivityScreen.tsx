import React from 'react';

import {ActionButton} from '../../../components/ActionButton';
import {InfoCard} from '../../../components/InfoCard';
import {ListEmpty} from '../../../components/ListEmpty';
import {Screen} from '../../../components/Screen';
import {useDashboardStore} from '../../../store/dashboardStore';

export const ActivityScreen = () => {
  const {activities, realtimeFeed, refreshActivities} = useDashboardStore();

  return (
    <Screen
      title="Activity Tracking"
      subtitle="Historical backend activity plus the live websocket feed."
      rightSlot={
        <ActionButton
          label="Refresh"
          variant="secondary"
          onPress={() => refreshActivities().catch(() => {})}
        />
      }>
      {activities.length ? (
        activities.map(activity => (
          <InfoCard
            key={activity._id || `${activity.action}-${activity.createdAt}`}
            title={`${activity.user?.name || 'User'} | ${activity.action || 'activity'}`}
            body={activity.details || 'No details'}
            footer={activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}
          />
        ))
      ) : (
        <ListEmpty message="No backend activity records returned yet." />
      )}

      {realtimeFeed.length
        ? realtimeFeed.map(item => (
            <InfoCard
              key={item.id}
              title={`Live | ${item.title}`}
              body={item.detail}
              footer={new Date(item.timestamp).toLocaleString()}
            />
          ))
        : null}
    </Screen>
  );
};
