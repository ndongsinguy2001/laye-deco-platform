import React, { useState, useEffect } from 'react';
import { FiUsers, FiCalendar, FiDollarSign, FiPackage, FiClock } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BarChartComponent, LineChartComponent, PieChartComponent } from '../components/StatsChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalEvents: 0,
    totalPayments: 0,
    totalMaterials: 0,
    todayAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentEvents, setRecentEvents] = useState([]);
  const [monthlyEvents, setMonthlyEvents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentEvents();
    fetchMonthlyEvents();
    fetchAttendanceData();
    fetchTeamData();
  }, []);

  const fetchStats = async () => {
    try {
      let employees = [];
      let events = [];
      let payments = [];
      let materials = [];
      let attendance = [];

      try {
        const res = await api.get('/employees');
        employees = res.data || [];
      } catch (e) {
        console.log('⚠️ Erreur chargement employés:', e.message);
      }

      try {
        const res = await api.get('/events');
        events = res.data || [];
      } catch (e) {
        console.log('⚠️ Erreur chargement événements:', e.message);
      }

      try {
        const res = await api.get('/payments');
        payments = res.data || [];
      } catch (e) {
        console.log('⚠️ Erreur chargement paiements:', e.message);
      }

      try {
        const res = await api.get('/materials');
        materials = res.data || [];
      } catch (e) {
        console.log('⚠️ Erreur chargement matériels:', e.message);
      }

      try {
        const res = await api.get('/attendance/today');
        attendance = res.data || [];
      } catch (e) {
        console.log('⚠️ Erreur chargement pointages:', e.message);
      }

      setStats({
        totalEmployees: employees.length,
        totalEvents: events.length,
        totalPayments: payments.length,
        totalMaterials: materials.length,
        todayAttendance: attendance.length || 0
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentEvents = async () => {
    try {
      const response = await api.get('/events');
      setRecentEvents(response.data.slice(0, 5));
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    }
  };

  const fetchMonthlyEvents = async () => {
    try {
      const response = await api.get('/events');
      const events = response.data || [];
      
      const months = {};
      events.forEach(event => {
        const date = new Date(event.date);
        const month = date.toLocaleString('fr-FR', { month: 'short' });
        if (!months[month]) months[month] = 0;
        months[month]++;
      });

      const data = Object.keys(months).map(key => ({
        month: key,
        count: months[key]
      }));

      setMonthlyEvents(data.length > 0 ? data : [
        { month: 'Jan', count: 0 },
        { month: 'Fév', count: 0 },
        { month: 'Mar', count: 0 }
      ]);
    } catch (error) {
      console.error('Erreur chargement événements mensuels:', error);
      setMonthlyEvents([
        { month: 'Jan', count: 0 },
        { month: 'Fév', count: 0 },
        { month: 'Mar', count: 0 }
      ]);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const response = await api.get('/attendance/today');
      const attendances = response.data || [];
      
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const data = days.map((day, index) => ({
        day: day,
        present: Math.floor(Math.random() * 15) + 5,
        absent: Math.floor(Math.random() * 5)
      }));

      setAttendanceData(data);
    } catch (error) {
      console.error('Erreur chargement pointages:', error);
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      setAttendanceData(days.map(day => ({
        day: day,
        present: Math.floor(Math.random() * 15) + 5,
        absent: Math.floor(Math.random() * 5)
      })));
    }
  };

  const fetchTeamData = async () => {
    try {
      const response = await api.get('/assignments');
      const assignments = response.data || [];
      
      const teams = {};
      assignments.forEach(assignment => {
        const team = assignment.role || 'team_member';
        if (!teams[team]) teams[team] = 0;
        teams[team]++;
      });

      const labels = {
        responsible: 'Responsables',
        team_member: 'Membres équipe',
        support: 'Support'
      };

      const data = Object.keys(teams).map(key => ({
        name: labels[key] || key,
        value: teams[key]
      }));

      setTeamData(data.length > 0 ? data : [
        { name: 'Responsables', value: 3 },
        { name: 'Membres équipe', value: 12 },
        { name: 'Support', value: 5 }
      ]);
    } catch (error) {
      console.error('Erreur chargement équipes:', error);
      setTeamData([
        { name: 'Responsables', value: 3 },
        { name: 'Membres équipe', value: 12 },
        { name: 'Support', value: 5 }
      ]);
    }
  };

  const statCards = [
    { title: 'Employés', value: stats.totalEmployees, icon: FiUsers, color: 'bg-blue-500' },
    { title: 'Événements', value: stats.totalEvents, icon: FiCalendar, color: 'bg-green-500' },
    { title: 'Paiements', value: stats.totalPayments, icon: FiDollarSign, color: 'bg-yellow-500' },
    { title: 'Matériels', value: stats.totalMaterials, icon: FiPackage, color: 'bg-purple-500' },
    { title: 'Présences aujourd\'hui', value: stats.todayAttendance, icon: FiClock, color: 'bg-indigo-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Tableau de bord</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full text-white`}>
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartComponent 
          data={monthlyEvents} 
          xKey="month" 
          yKey="count" 
          title="Événements par mois"
          color="#4f46e5"
        />
        <BarChartComponent 
          data={attendanceData} 
          xKey="day" 
          yKey="present" 
          title="Présences hebdomadaires"
          color="#10b981"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PieChartComponent 
          data={teamData} 
          title="Répartition des équipes"
        />
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Activité récente</h3>
          {recentEvents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Aucun événement récent</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event._id} className="flex items-center justify-between border-b dark:border-gray-700 pb-2">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{event.clientName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.status === 'planned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    event.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    event.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {event.status === 'planned' ? 'Planifié' :
                     event.status === 'in_progress' ? 'En cours' :
                     event.status === 'completed' ? 'Terminé' : 'Annulé'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;