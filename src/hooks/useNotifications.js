import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { userData, currentUser } = useAuth();
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
        
        // Obtener fecha de registro del usuario
        // Prioridad: userData.createdAt de Firestore
        // Fallback: metadata de Firebase Auth
        let userCreatedAt = null;
        if (userData?.createdAt) {
          // Es un Firestore Timestamp, usarlo directamente
          userCreatedAt = userData.createdAt;
        } else if (currentUser?.metadata?.creationTime) {
          // Convertir el string de Auth a Date
          userCreatedAt = new Date(currentUser.metadata.creationTime);
        }

        // Construir query base
        let constraints = [
          where('targetCountry', 'in', ['all', userCountry]),
          orderBy('sentAt', 'desc'),
          limit(20)
        ];

        // Agregar filtro de fecha solo si tenemos la fecha de creación
        if (userCreatedAt) {
          constraints = [
            where('targetCountry', 'in', ['all', userCountry]),
            where('sentAt', '>=', userCreatedAt),
            orderBy('sentAt', 'desc'),
            limit(20)
          ];
        }

        const q = query(
          collection(db, 'adminNotifications'),
          ...constraints
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
  }, [userData?.country, userData?.createdAt, currentUser?.metadata?.creationTime]);

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
