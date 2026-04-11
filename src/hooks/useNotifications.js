import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState(() => 
    JSON.parse(localStorage.getItem('dismissedNotifs') || '[]')
  );

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const userCountry = userData?.country || 'all';
        const q = query(
          collection(db, 'adminNotifications'),
          where('targetCountry', 'in', ['all', userCountry]),
          orderBy('sentAt', 'desc'),
          limit(20)
        );
        
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(list);
      } catch (err) {
        console.error('Error fetch notifs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userData?.country]);

  const dismissOne = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedNotifs', JSON.stringify(newDismissed));
  };

  const dismissAll = () => {
    const allIds = notifications.map(n => n.id);
    const newDismissed = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedNotifs', JSON.stringify(newDismissed));
  };

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  return { activeNotifications, loading, dismissOne, dismissAll };
}
