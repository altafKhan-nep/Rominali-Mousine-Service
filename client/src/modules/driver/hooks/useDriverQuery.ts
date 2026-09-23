import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api.js';

export const useDriverStats = () => useQuery({
  queryKey: ['driver','stats'],
  queryFn: async () => (await api.get('/drivers/stats')).data,
});

export const useDriverRides = (params:any={}) => useQuery({
  queryKey: ['driver','rides', params],
  queryFn: async () => (await api.get('/rides', { params })).data,
});

export const useDriverPayments = () => useQuery({
  queryKey: ['driver','payments'],
  queryFn: async () => (await api.get('/payments')).data,
});

export const useDriverProfile = () => useQuery({
  queryKey: ['driver','profile'],
  queryFn: async () => (await api.get('/users/me')).data,
});

export const useToggleAvailability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (isAvailable:boolean) => (await api.patch('/drivers/availability', { isAvailable })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey:['driver','profile'] }); qc.invalidateQueries({ queryKey:['driver','stats'] }); },
  });
};
