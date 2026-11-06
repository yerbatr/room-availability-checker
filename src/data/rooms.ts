import type { RoomSchedule } from '@/lib/bookingRules';

export const EQUIPMENT_OPTIONS = [
  'Projector',
  'Whiteboard',
  'Video Conferencing',
  'Sound System',
  'Lab Workstations',
] as const;

export type EquipmentItem = (typeof EQUIPMENT_OPTIONS)[number];

export interface Room extends RoomSchedule {
  id: string;
  building: string;
  capacity: number;
  equipment: EquipmentItem[];
}

export const ROOMS: Room[] = [
  {
    id: 'LT101',
    name: 'Lecture Theatre 101',
    building: 'Engineering Block A',
    capacity: 120,
    equipment: ['Projector', 'Whiteboard', 'Sound System', 'Video Conferencing'],
    blocked: false,
    bookings: [
      { start: 480, end: 600, label: 'CS301 Algorithms' },
      { start: 660, end: 780, label: 'MATH202 Calculus' },
      { start: 900, end: 960, label: 'CS410 Networks' },
    ],
  },
  {
    id: 'SR204',
    name: 'Seminar Room 204',
    building: 'Arts & Sciences Building',
    capacity: 30,
    equipment: ['Projector', 'Whiteboard', 'Video Conferencing'],
    blocked: false,
    bookings: [
      { start: 540, end: 600, label: 'Group Project Meeting' },
      { start: 720, end: 840, label: 'Philosophy Seminar' },
      { start: 1080, end: 1140, label: 'Research Discussion' },
    ],
  },
  {
    id: 'LAB3',
    name: 'Computer Lab 3',
    building: 'Technology Hub',
    capacity: 40,
    equipment: ['Projector', 'Whiteboard', 'Lab Workstations'],
    blocked: true,
    blockedReason: 'Under scheduled maintenance until further notice',
    bookings: [
      { start: 600, end: 720, label: 'Web Dev Workshop' },
    ],
  },
  {
    id: 'CR305',
    name: 'Conference Room 305',
    building: 'Administration Centre',
    capacity: 16,
    equipment: ['Whiteboard', 'Video Conferencing'],
    blocked: false,
    bookings: [
      { start: 480, end: 540, label: 'Faculty Meeting' },
      { start: 840, end: 960, label: 'Board Review' },
      { start: 1200, end: 1320, label: 'Annual Planning' },
    ],
  },
  {
    id: 'STU1',
    name: 'Studio Lab 1',
    building: 'Creative Arts Wing',
    capacity: 20,
    equipment: ['Projector', 'Sound System', 'Lab Workstations'],
    blocked: false,
    bookings: [
      { start: 570, end: 690, label: 'Design Workshop' },
      { start: 780, end: 900, label: 'Media Production' },
    ],
  },
];
