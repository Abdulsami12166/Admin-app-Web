import React from 'react';

import {ActionButton} from '../../../components/ActionButton';
import {InfoCard} from '../../../components/InfoCard';
import {ListEmpty} from '../../../components/ListEmpty';
import {Screen} from '../../../components/Screen';
import {useDashboardStore} from '../../../store/dashboardStore';

export const ActivityScreen = () => {
  const {activities, realtimeFeed, refreshActivities} = useDashboardStore();

  // Sort activities to ensure logout/signout comes last
  const sortedActivities = React.useMemo(() => {
    const nonLogout = activities.filter(a => !a.action?.toLowerCase().includes('logout') && !a.action?.toLowerCase().includes('signout'));
    const logout = activities.filter(a => a.action?.toLowerCase().includes('logout') || a.action?.toLowerCase().includes('signout'));
    return [...nonLogout, ...logout];
  }, [activities]);

  // Sort real-time feed to ensure logout/signout comes last
  const sortedRealtime = React.useMemo(() => {
    const nonLogout = realtimeFeed.filter(f => !f.title?.toLowerCase().includes('logout') && !f.title?.toLowerCase().includes('signout'));
    const logout = realtimeFeed.filter(f => f.title?.toLowerCase().includes('logout') || f.title?.toLowerCase().includes('signout'));
    return [...nonLogout, ...logout];
  }, [realtimeFeed]);

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
      {sortedActivities.length ? (
        sortedActivities.map(activity => (
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

      {sortedRealtime.length
        ? sortedRealtime.map(item => (
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
