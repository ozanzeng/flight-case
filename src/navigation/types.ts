import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  FlightList: undefined;
  FlightDetail: { flightId: string };
  Favorites: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
