import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api.js';

export const useCrmAnalytics = () => useQuery({
  queryKey: ['crm','analytics'],
  queryFn: async () => (await api.get('/crm/analytics')).data,
});
export const useCrmTimeseries = (days=14) => useQuery({
  queryKey: ['crm','timeseries',days],
  queryFn: async () => (await api.get(`/crm/analytics/timeseries?days=${days}`)).data,
});
export const useCrmRides = (params={}) => useQuery({
  queryKey: ['crm','rides',params],
  queryFn: async () => (await api.get('/crm/rides', { params })).data,
});
export const useCrmLiveOps = () => useQuery({
  queryKey: ['crm','liveOps'],
  queryFn: async () => (await api.get('/crm/operations/live')).data,
  refetchInterval: 8000,
});
export const useCrmAudit = () => useQuery({
  queryKey: ['crm','audit'],
  queryFn: async () => (await api.get('/crm/audit')).data,
});

export const useDispatchMutate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, driverId }: { id:string; driverId:string|null }) =>
      (await api.patch(`/crm/rides/${id}/dispatch`, { driverId })).data,
    onMutate: async ({ id, driverId }) => {
      await qc.cancelQueries({ queryKey: ['crm','rides'] });
      const prev = qc.getQueryData<any>(['crm','rides', {}]);
      // optimistic: keep previous - real invalidation on success handles it
      return { prev };
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm','rides'] }); qc.invalidateQueries({ queryKey: ['crm','analytics'] }); },
  });
};
