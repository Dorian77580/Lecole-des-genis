import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Alert, AlertDescription } from './components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Separator } from './components/ui/separator';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Heart, 
  Star, 
  Download, 
  Upload,
  CheckCircle,
  Clock,
  Menu,
  X,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Settings,
  Crown,
  Zap,
  Shield
} from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Constants moved outside component to prevent re-renders
const LEVELS = ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'];
const SUBJECTS = ['mathématiques', 'français', 'sciences', 'découverte du monde', 'histoire', 'géographie'];

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sheets, setSheets] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filters, setFilters] = useState({ level: 'all', subject: 'all' });
  const [authMode, setAuthMode] = useState('login');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [verificationFile, setVerificationFile] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [adminSheets, setAdminSheets] = useState([]);
  const [newSheet, setNewSheet] = useState({
    title: '',
    description: '',
    level: 'PS',
    subject: 'mathématiques',
    is_premium: false,
    is_teacher_only: false,
    file: null
  });
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setIsLoading(false);
    }

    // Check for reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetTokenFromUrl = urlParams.get('token');
    if (resetTokenFromUrl) {
      setResetToken(resetTokenFromUrl);
      setCurrentView('reset-password');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSheets();
    }
  }, [user, filters]);

  const showAlert = useCallback((message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      showAlert('Session expirée, veuillez vous reconnecter', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSheets = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.level && filters.level !== 'all') params.append('level', filters.level);
      if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
      
      const response = await axios.get(`${API_BASE_URL}/api/pedagogical-sheets?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSheets(response.data.sheets);
    } catch (error) {
      showAlert('Erreur lors du chargement des fiches', 'error');
    }
  };

  // Separate auth form component to avoid re-renders
  const AuthForm = () => {
    const [localAuthForm, setLocalAuthForm] = useState({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      userType: 'parent'
    });
    
    const handleLocalAuth = async (e) => {
      e.preventDefault();
      try {
        const endpoint = authMode === 'login' ? 'login' : 'register';
        const payload = authMode === 'login' 
          ? { email: localAuthForm.email, password: localAuthForm.password }
          : {
              email: localAuthForm.email,
              password: localAuthForm.password,
              first_name: localAuthForm.firstName,
              last_name: localAuthForm.lastName,
              user_type: localAuthForm.userType
            };

        const response = await axios.post(`${API_BASE_URL}/api/auth/${endpoint}`, payload);
        
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setCurrentView('dashboard');
        showAlert(authMode === 'login' ? 'Connexion réussie!' : 'Inscription réussie!', 'success');
      } catch (error) {
        showAlert(error.response?.data?.detail || 'Erreur d\'authentification', 'error');
      }
    };
    
    return (
      <form onSubmit={handleLocalAuth} className="space-y-4">
        {authMode === 'register' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Votre prénom"
                  value={localAuthForm.firstName}
                  onChange={(e) => setLocalAuthForm(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Votre nom"
                  value={localAuthForm.lastName}
                  onChange={(e) => setLocalAuthForm(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="userType">Je suis</Label>
              <Select
                value={localAuthForm.userType}
                onValueChange={(value) => setLocalAuthForm(prev => ({ ...prev, userType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="teacher">Professeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {authMode !== 'forgot-password' && (
          <>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                value={localAuthForm.email}
                onChange={(e) => setLocalAuthForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Votre mot de passe"
                value={localAuthForm.password}
                onChange={(e) => setLocalAuthForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
          </>
        )}

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
        >
          {authMode === 'login' ? 'Se connecter' : authMode === 'register' ? 'S\'inscrire' : 'Réinitialiser'}
        </Button>
      </form>
    );
  };

  // Forgot Password Form Component
  const ForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <div>
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="votre@email.com"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          required
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
      >
        Envoyer le lien de réinitialisation
      </Button>
    </form>
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('home');
    showAlert('Déconnexion réussie', 'success');
  };

  const handleSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/subscription/simulate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(prev => ({ ...prev, is_premium: true }));
      showAlert('Abonnement Premium activé! (simulation)', 'success');
    } catch (error) {
      showAlert('Erreur lors de l\'abonnement', 'error');
    }
  };

  const handleVerificationUpload = async (e) => {
    e.preventDefault();
    if (!verificationFile) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', verificationFile);

      await axios.post(`${API_BASE_URL}/api/teacher/verification`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showAlert('Justificatif envoyé avec succès! Vérification en cours.', 'success');
      setVerificationFile(null);
    } catch (error) {
      showAlert(error.response?.data?.detail || 'Erreur lors de l\'envoi', 'error');
    }
  };

  const downloadFile = async (fileUrl) => {
    try {
      const token = localStorage.getItem('token');
      const filename = fileUrl.split('/').pop();
      
      const response = await axios.get(`${API_BASE_URL}${fileUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showAlert('Erreur lors du téléchargement', 'error');
    }
  };

  // Admin functions
  const fetchAdminStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminStats(response.data);
    } catch (error) {
      showAlert('Erreur lors du chargement des statistiques', 'error');
    }
  }, [showAlert]);

  const fetchAdminSheets = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/pedagogical-sheets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminSheets(response.data.sheets);
    } catch (error) {
      showAlert('Erreur lors du chargement des fiches', 'error');
    }
  }, [showAlert]);

  const createSheet = useCallback(async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('title', newSheet.title);
      formData.append('description', newSheet.description);
      formData.append('level', newSheet.level);
      formData.append('subject', newSheet.subject);
      formData.append('is_premium', newSheet.is_premium);
      formData.append('is_teacher_only', newSheet.is_teacher_only);
      formData.append('file', newSheet.file);

      await axios.post(`${API_BASE_URL}/api/admin/pedagogical-sheets`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showAlert('Fiche créée avec succès!', 'success');
      
      // Reset form
      setNewSheet({
        title: '',
        description: '',
        level: 'PS',
        subject: 'mathématiques',
        is_premium: false,
        is_teacher_only: false,
        file: null
      });
      
      // Refresh admin sheets
      await fetchAdminSheets();
    } catch (error) {
      showAlert('Erreur lors de la création', 'error');
    }
  }, [newSheet, fetchAdminSheets, showAlert]);

  const deleteSheet = useCallback(async (sheetId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/admin/pedagogical-sheets/${sheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showAlert('Fiche supprimée avec succès!', 'success');
      await fetchAdminSheets();
    } catch (error) {
      showAlert('Erreur lors de la suppression', 'error');
    }
  }, [fetchAdminSheets, showAlert]);

  // Admin password reset function
  const resetUserPassword = useCallback(async (email, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('email', email);
      formData.append('new_password', newPassword);

      const response = await axios.post(`${API_BASE_URL}/api/admin/reset-user-password`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showAlert(`Mot de passe réinitialisé pour ${email}`, 'success');
      return response.data;
    } catch (error) {
      showAlert('Erreur lors de la réinitialisation', 'error');
      throw error;
    }
  }, [showAlert]);

// Separate Admin component to isolate state and prevent re-renders
const AdminComponent = ({ user, onNavigateBack }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [adminStats, setAdminStats] = useState(null);
  const [adminSheets, setAdminSheets] = useState([]);
  const [newSheet, setNewSheet] = useState({
    title: '',
    description: '',
    level: 'PS',
    subject: 'mathématiques',
    is_premium: false,
    is_teacher_only: false,
    file: null
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  const showAlert = useCallback((message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  }, []);

  const fetchAdminStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminStats(response.data);
    } catch (error) {
      showAlert('Erreur lors du chargement des statistiques', 'error');
    }
  }, [showAlert]);

  const fetchAdminSheets = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/pedagogical-sheets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminSheets(response.data.sheets);
    } catch (error) {
      showAlert('Erreur lors du chargement des fiches', 'error');
    }
  }, [showAlert]);

  const createSheet = useCallback(async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('title', newSheet.title);
      formData.append('description', newSheet.description);
      formData.append('level', newSheet.level);
      formData.append('subject', newSheet.subject);
      formData.append('is_premium', newSheet.is_premium);
      formData.append('is_teacher_only', newSheet.is_teacher_only);
      formData.append('file', newSheet.file);

      await axios.post(`${API_BASE_URL}/api/admin/pedagogical-sheets`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showAlert('Fiche créée avec succès!', 'success');
      
      setNewSheet({
        title: '',
        description: '',
        level: 'PS',
        subject: 'mathématiques',
        is_premium: false,
        is_teacher_only: false,
        file: null
      });
      
      await fetchAdminSheets();
    } catch (error) {
      showAlert('Erreur lors de la création', 'error');
    }
  }, [newSheet, fetchAdminSheets, showAlert]);

  const deleteSheet = useCallback(async (sheetId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/admin/pedagogical-sheets/${sheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showAlert('Fiche supprimée avec succès!', 'success');
      await fetchAdminSheets();
    } catch (error) {
      showAlert('Erreur lors de la suppression', 'error');
    }
  }, [fetchAdminSheets, showAlert]);

  const resetUserPassword = useCallback(async (email, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('email', email);
      formData.append('new_password', newPassword);

      await axios.post(`${API_BASE_URL}/api/admin/reset-user-password`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showAlert(`Mot de passe réinitialisé pour ${email}`, 'success');
    } catch (error) {
      showAlert('Erreur lors de la réinitialisation', 'error');
    }
  }, [showAlert]);

  const downloadFile = useCallback(async (fileUrl) => {
    try {
      const token = localStorage.getItem('token');
      const filename = fileUrl.split('/').pop();
      
      const response = await axios.get(`${API_BASE_URL}${fileUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showAlert('Erreur lors du téléchargement', 'error');
    }
  }, [showAlert]);

  useEffect(() => {
    if (user && user.is_admin) {
      fetchAdminStats();
      fetchAdminSheets();
    }
  }, [user, fetchAdminStats, fetchAdminSheets]);

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-12 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès Admin Requis</h2>
            <p className="text-gray-600 mb-4">Vous devez être administrateur pour accéder à cette page.</p>
            <Button onClick={() => onNavigateBack('home')}>
              Retour à l'accueil
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-2 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">L'École des Génies - Admin</h1>
                <p className="text-sm text-gray-600">Bonjour Marine</p>
              </div>
            </div>
            
            <Button onClick={() => onNavigateBack('dashboard')}>
              Retour au site
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {alert.show && (
          <Alert className={`mb-4 ${
            alert.type === 'error' ? 'border-red-500 bg-red-50' : 
            alert.type === 'success' ? 'border-green-500 bg-green-50' : 
            'border-blue-500 bg-blue-50'
          }`}>
            <AlertDescription className={
              alert.type === 'error' ? 'text-red-700' : 
              alert.type === 'success' ? 'text-green-700' : 
              'text-blue-700'
            }>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Espace Administrateur
          </h2>
          <p className="text-gray-600">
            Gérez le contenu et consultez les statistiques de la plateforme
          </p>
        </div>

        {/* Stats Dashboard */}
        {adminStats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilisateurs totaux</p>
                  <p className="text-2xl font-bold text-gray-900">{adminStats.users.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Membres Premium</p>
                  <p className="text-2xl font-bold text-yellow-600">{adminStats.users.premium}</p>
                </div>
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fiches totales</p>
                  <p className="text-2xl font-bold text-green-600">{adminStats.sheets.total}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Professeurs vérifiés</p>
                  <p className="text-2xl font-bold text-purple-600">{adminStats.users.verified_teachers}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Simple Tabs */}
        <div className="space-y-6">
          <div className="bg-white border-b border-gray-200 rounded-lg">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'create'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Créer une fiche
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'manage'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gérer les fiches
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gestion utilisateurs
              </button>
            </nav>
          </div>

          {/* Tab Content with keys for stability */}
          <div key={`tab-${activeTab}`} className="space-y-6">
            {activeTab === 'create' && (
              <Card className="p-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">
                    Créer une nouvelle fiche pédagogique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createSheet} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="title">Titre</Label>
                        <Input
                          id="title"
                          value={newSheet.title}
                          onChange={(e) => setNewSheet(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ex: Les fractions - CM2"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="level">Niveau</Label>
                        <Select
                          value={newSheet.level}
                          onValueChange={(value) => setNewSheet(prev => ({ ...prev, level: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEVELS.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        value={newSheet.description}
                        onChange={(e) => setNewSheet(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-md resize-none"
                        rows="3"
                        placeholder="Décrivez le contenu de la fiche..."
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="subject">Matière</Label>
                        <Select
                          value={newSheet.subject}
                          onValueChange={(value) => setNewSheet(prev => ({ ...prev, subject: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECTS.map(subject => (
                              <SelectItem key={subject} value={subject}>
                                {subject.charAt(0).toUpperCase() + subject.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_premium"
                            checked={newSheet.is_premium}
                            onChange={(e) => setNewSheet(prev => ({ ...prev, is_premium: e.target.checked }))}
                          />
                          <Label htmlFor="is_premium">Premium</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_teacher_only"
                            checked={newSheet.is_teacher_only}
                            onChange={(e) => setNewSheet(prev => ({ ...prev, is_teacher_only: e.target.checked }))}
                          />
                          <Label htmlFor="is_teacher_only">Professeurs uniquement</Label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="file">Fichier PDF</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setNewSheet(prev => ({ ...prev, file: e.target.files[0] }))}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                      disabled={!newSheet.file}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Créer la fiche
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'manage' && (
              <Card className="p-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">
                    Gérer les fiches pédagogiques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminSheets.map(sheet => (
                      <div key={sheet.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{sheet.title}</h3>
                            <Badge variant="outline">{sheet.level}</Badge>
                            {sheet.is_premium && (
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                Premium
                              </Badge>
                            )}
                            {sheet.is_teacher_only && (
                              <Badge variant="secondary">Professeurs</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">{sheet.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {sheet.subject} • Créé le {new Date(sheet.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(sheet.file_url)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSheet(sheet.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {adminSheets.length === 0 && (
                      <div className="text-center py-12">
                        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Aucune fiche créée
                        </h3>
                        <p className="text-gray-600">
                          Commencez par créer votre première fiche pédagogique
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'users' && (
              <Card className="p-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">
                    Réinitialisation de mot de passe
                  </CardTitle>
                  <p className="text-gray-600">
                    Réinitialisez le mot de passe d'un utilisateur
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">Réinitialisation rapide</h4>
                      <div className="space-y-4">
                        <Button
                          onClick={() => resetUserPassword('Marine.alves1995@gmail.com', 'Marine77')}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          Réinitialiser mon mot de passe → Marine77
                        </Button>
                        <p className="text-sm text-yellow-700">
                          Ceci réinitialisera le mot de passe de Marine.alves1995@gmail.com à "Marine77"
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Réinitialisation personnalisée</h4>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const email = formData.get('email');
                        const password = formData.get('password');
                        resetUserPassword(email, password);
                        e.target.reset();
                      }} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="reset-email">Email utilisateur</Label>
                            <Input
                              id="reset-email"
                              name="email"
                              type="email"
                              placeholder="utilisateur@example.com"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="reset-password">Nouveau mot de passe</Label>
                            <Input
                              id="reset-password"
                              name="password"
                              type="text"
                              placeholder="NouveauMotDePasse123"
                              required
                            />
                          </div>
                        </div>
                        <Button 
                          type="submit"
                          variant="outline"
                          className="border-rose-300 text-rose-600 hover:bg-rose-50"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Réinitialiser le mot de passe
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

  // Password reset functions
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: resetEmail
      });
      
      showAlert('Si cet email existe, vous recevrez un lien de réinitialisation', 'success');
      setAuthMode('login');
      setResetEmail('');
    } catch (error) {
      showAlert('Erreur lors de la demande de réinitialisation', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token: resetToken,
        new_password: newPassword
      });
      
      showAlert('Mot de passe réinitialisé avec succès! Vous pouvez maintenant vous connecter.', 'success');
      setCurrentView('auth');
      setAuthMode('login');
      setResetToken('');
      setNewPassword('');
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      showAlert(error.response?.data?.detail || 'Erreur lors de la réinitialisation', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-rose-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const Header = () => (
    <header className="bg-white shadow-sm border-b border-rose-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-2 rounded-xl">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">L'École des Génies</h1>
              <p className="text-sm text-gray-600">Fondée par Marine Alves</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentView('home')}
              className="text-gray-700 hover:text-rose-600"
            >
              Accueil
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('dashboard')}
                className="text-gray-700 hover:text-rose-600"
              >
                Mon espace
              </Button>
            )}
            {user && user.is_admin && (
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('admin')}
                className="text-gray-700 hover:text-rose-600"
              >
                Admin
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => setCurrentView('premium')}
              className="text-gray-700 hover:text-rose-600"
            >
              Premium
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setCurrentView('about')}
              className="text-gray-700 hover:text-rose-600"
            >
              À propos
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setCurrentView('contact')}
              className="text-gray-700 hover:text-rose-600"
            >
              Contact
            </Button>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  Bonjour, {user.first_name}
                </span>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-rose-300 text-rose-600 hover:bg-rose-50"
                >
                  Déconnexion
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setCurrentView('auth')}
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
              >
                Connexion
              </Button>
            )}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-rose-100">
          <div className="px-4 py-2 space-y-2">
            <Button 
              variant="ghost" 
              onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }}
              className="w-full text-left justify-start text-gray-700 hover:text-rose-600"
            >
              Accueil
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                onClick={() => { setCurrentView('dashboard'); setIsMenuOpen(false); }}
                className="w-full text-left justify-start text-gray-700 hover:text-rose-600"
              >
                Mon espace
              </Button>
            )}
            {user && user.is_admin && (
              <Button 
                variant="ghost" 
                onClick={() => { setCurrentView('admin'); setIsMenuOpen(false); }}
                className="w-full text-left justify-start text-gray-700 hover:text-rose-600"
              >
                Admin
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => { setCurrentView('premium'); setIsMenuOpen(false); }}
              className="w-full text-left justify-start text-gray-700 hover:text-rose-600"
            >
              Premium
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => { setCurrentView('about'); setIsMenuOpen(false); }}
              className="w-full text-left justify-start text-gray-700 hover:text-rose-600"
            >
              À propos
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => { setCurrentView('contact'); setIsMenuOpen(false); }}
              className="w-full text-left justify-start text-gray-700 hover:text-rose-600"
            >
              Contact
            </Button>
            {user ? (
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full text-left justify-start border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                Déconnexion
              </Button>
            ) : (
              <Button 
                onClick={() => { setCurrentView('auth'); setIsMenuOpen(false); }}
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
              >
                Connexion
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Une approche <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">bienveillante</span> de l'éducation
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Découvrez les ressources pédagogiques créées par Marine Alves, professeure passionnée, 
                  pour accompagner parents et enseignants dans l'épanouissement de chaque enfant.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => setCurrentView(user ? 'dashboard' : 'auth')}
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white px-8 py-6 text-lg"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Découvrir les ressources
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => setCurrentView('about')}
                  className="border-rose-300 text-rose-600 hover:bg-rose-50 px-8 py-6 text-lg"
                >
                  En savoir plus
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1569420626546-55b02c8376b1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBjaGlsZHJlbnxlbnwwfHx8fDE3NTUwNzg1MDZ8MA&ixlib=rb-4.1.0&q=85"
                alt="Enfant souriant - approche bienveillante"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                  <Heart className="h-8 w-8 text-rose-500" />
                  <div>
                    <p className="font-semibold text-gray-900">Pédagogie différenciée</p>
                    <p className="text-sm text-gray-600">Pour chaque enfant</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Pour qui ?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des ressources adaptées aux besoins de chaque utilisateur
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-2 border-rose-100 hover:border-rose-300 transition-colors">
              <CardHeader className="text-center">
                <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Parents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-center">
                  Accompagnez votre enfant à la maison avec nos fiches pédagogiques 
                  et conseils bienveillants.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Fiches gratuites disponibles
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Star className="h-4 w-4 text-orange-500 mr-2" />
                    Accès premium aux ressources inédites
                  </li>
                  <li className="flex items-center text-gray-700">
                    <BookOpen className="h-4 w-4 text-blue-500 mr-2" />
                    Ebooks d'accompagnement parental
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-8 border-2 border-orange-100 hover:border-orange-300 transition-colors">
              <CardHeader className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Professeurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-center">
                  Enrichissez vos cours avec des ressources pédagogiques 
                  créées par et pour les enseignants.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Fiches à l'unité ou en lot
                  </li>
                  <li className="flex items-center text-gray-700">
                    <GraduationCap className="h-4 w-4 text-blue-500 mr-2" />
                    Validation du statut professionnel
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Heart className="h-4 w-4 text-rose-500 mr-2" />
                    Approche pédagogique différenciée
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-rose-500 to-orange-500">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl font-bold text-white mb-6">
            Prêt à commencer l'aventure ?
          </h3>
          <p className="text-xl text-rose-100 mb-8">
            Rejoignez notre communauté et découvrez des ressources qui font la différence
          </p>
          <Button 
            size="lg"
            onClick={() => setCurrentView(user ? 'dashboard' : 'auth')}
            className="bg-white text-rose-600 hover:bg-gray-50 px-8 py-6 text-lg font-semibold"
          >
            {user ? 'Accéder à mon espace' : 'Créer mon compte gratuit'}
          </Button>
        </div>
      </section>
    </div>
  );

  const AuthPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <Card className="w-full max-w-md p-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {authMode === 'login' ? 'Connexion' : 
               authMode === 'register' ? 'Inscription' : 
               'Mot de passe oublié'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authMode === 'forgot-password' ? <ForgotPasswordForm /> : <AuthForm />}

            <div className="mt-6 text-center space-y-3">
              {authMode === 'login' && (
                <Button
                  variant="link"
                  onClick={() => setAuthMode('forgot-password')}
                  className="text-rose-600 text-sm"
                >
                  Mot de passe oublié ?
                </Button>
              )}
              
              {authMode !== 'forgot-password' && (
                <Button
                  variant="link"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-rose-600"
                >
                  {authMode === 'login' 
                    ? 'Pas encore de compte ? S\'inscrire' 
                    : 'Déjà un compte ? Se connecter'
                  }
                </Button>
              )}
              
              {authMode === 'forgot-password' && (
                <Button
                  variant="link"
                  onClick={() => setAuthMode('login')}
                  className="text-rose-600"
                >
                  Retour à la connexion
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const DashboardPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Status */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-rose-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Bonjour {user.first_name} {user.last_name} !
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-blue-300 text-blue-600">
                    {user.user_type === 'parent' ? 'Parent' : 'Professeur'}
                  </Badge>
                  {user.is_premium && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      Premium
                    </Badge>
                  )}
                  {user.user_type === 'teacher' && (
                    <Badge 
                      variant={user.is_verified ? 'default' : 'secondary'}
                      className={user.is_verified ? 'bg-green-500' : 'bg-gray-400'}
                    >
                      {user.is_verified ? 'Vérifié' : 'En attente de vérification'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                {user.user_type === 'parent' && !user.is_premium && (
                  <Button 
                    onClick={handleSubscription}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Passer Premium
                  </Button>
                )}
                
                {user.user_type === 'teacher' && !user.is_verified && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-orange-300 text-orange-600">
                        <Upload className="mr-2 h-4 w-4" />
                        Justifier mon statut
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Justificatif professionnel</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleVerificationUpload} className="space-y-4">
                        <div>
                          <Label htmlFor="verification-file">
                            Téléchargez votre justificatif professionnel
                          </Label>
                          <Input
                            id="verification-file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setVerificationFile(e.target.files[0])}
                            required
                          />
                          <p className="text-sm text-gray-600 mt-2">
                            Formats acceptés: PDF, JPG, PNG (max 5MB)
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          disabled={!verificationFile}
                          className="w-full bg-gradient-to-r from-orange-500 to-rose-500"
                        >
                          Envoyer le justificatif
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Card className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level-filter">Niveau scolaire</Label>
                <Select
                  value={filters.level}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, level: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les niveaux" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subject-filter">Matière</Label>
                <Select
                  value={filters.subject}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les matières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les matières</SelectItem>
                    {SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject.charAt(0).toUpperCase() + subject.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Pedagogical Sheets */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sheets.map(sheet => (
            <Card key={sheet.id} className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge 
                    variant="outline" 
                    className="mb-2 border-blue-300 text-blue-600"
                  >
                    {sheet.level}
                  </Badge>
                  <div className="flex gap-1">
                    {sheet.is_premium && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                        Premium
                      </Badge>
                    )}
                    {sheet.is_teacher_only && (
                      <Badge variant="secondary" className="text-xs">
                        Professeurs
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg text-gray-900">
                  {sheet.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  {sheet.description}
                </p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="border-green-300 text-green-600">
                    {sheet.subject.charAt(0).toUpperCase() + sheet.subject.slice(1)}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => downloadFile(sheet.file_url)}
                    className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sheets.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune fiche disponible
            </h3>
            <p className="text-gray-600">
              Aucune fiche ne correspond à vos critères de recherche.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const AboutPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            À propos de L'École des Génies
          </h2>
          <p className="text-xl text-gray-600">
            Une approche bienveillante et différenciée de l'éducation
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxsZWFybmluZyUyMHBlZGFnb2d5fGVufDB8fHx8MTc1NTA3ODUxM3ww&ixlib=rb-4.1.0&q=85"
              alt="Environnement d'apprentissage collaboratif"
              className="rounded-2xl shadow-lg"
            />
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Marine Alves, fondatrice
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Professeure passionnée dans l'Éducation nationale, Marine Alves a créé L'École des Génies 
              avec une vision claire : accompagner chaque enfant dans son parcours d'apprentissage avec 
              bienveillance et pédagogie différenciée.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Forte de son expérience sur le terrain, elle propose des ressources pédagogiques 
              innovantes qui répondent aux besoins réels des parents et des enseignants.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-rose-100 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Notre approche
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Bienveillance</h4>
              <p className="text-gray-600 text-sm">
                Une approche respectueuse du rythme et des besoins de chaque enfant
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Excellence</h4>
              <p className="text-gray-600 text-sm">
                Des ressources de qualité, testées et approuvées par des professionnels
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Communauté</h4>
              <p className="text-gray-600 text-sm">
                Un réseau de parents et d'enseignants unis pour la réussite des enfants
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PremiumPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Devenez membre <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">Premium</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Accédez à toutes nos ressources exclusives et accompagnez votre enfant vers la réussite scolaire
          </p>
        </div>

        {/* Comparison Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Free Plan */}
          <Card className="p-8 border-2 border-gray-200">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-gray-900">Gratuit</CardTitle>
              <div className="text-3xl font-bold text-gray-600 mt-4">0€</div>
              <p className="text-gray-600">par mois</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Accès aux fiches gratuites
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Téléchargement PDF
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Support par email
                </li>
                <li className="flex items-center text-gray-400">
                  <X className="h-5 w-5 text-gray-300 mr-3" />
                  Fiches premium exclusives
                </li>
                <li className="flex items-center text-gray-400">
                  <X className="h-5 w-5 text-gray-300 mr-3" />
                  Nouveautés en avant-première
                </li>
                <li className="flex items-center text-gray-400">
                  <X className="h-5 w-5 text-gray-300 mr-3" />
                  Conseils personnalisés
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="p-8 border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                Recommandé
              </Badge>
            </div>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-gray-900">Premium</CardTitle>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 mt-4">
                9,99€
              </div>
              <p className="text-gray-600">par mois</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <strong>Tout du plan gratuit</strong>
                </li>
                <li className="flex items-center text-gray-700">
                  <Star className="h-5 w-5 text-yellow-500 mr-3" />
                  Accès à toutes les fiches premium
                </li>
                <li className="flex items-center text-gray-700">
                  <Zap className="h-5 w-5 text-orange-500 mr-3" />
                  Nouveautés en avant-première
                </li>
                <li className="flex items-center text-gray-700">
                  <BookOpen className="h-5 w-5 text-blue-500 mr-3" />
                  Ebooks exclusifs de guidance parentale
                </li>
                <li className="flex items-center text-gray-700">
                  <Heart className="h-5 w-5 text-rose-500 mr-3" />
                  Conseils personnalisés de Marine
                </li>
                <li className="flex items-center text-gray-700">
                  <Shield className="h-5 w-5 text-indigo-500 mr-3" />
                  Support prioritaire
                </li>
              </ul>
              
              {user && !user.is_premium && (
                <Button 
                  onClick={handleSubscription}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-lg py-6"
                >
                  <Crown className="mr-2 h-5 w-5" />
                  Devenir Premium
                </Button>
              )}
              
              {user && user.is_premium && (
                <div className="text-center">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-lg px-6 py-3">
                    <Crown className="mr-2 h-5 w-5" />
                    Vous êtes Premium !
                  </Badge>
                </div>
              )}
              
              {!user && (
                <Button 
                  onClick={() => setCurrentView('auth')}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-lg py-6"
                >
                  Commencer mon essai gratuit
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-rose-100 mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Pourquoi choisir Premium ?
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">
                Contenu Exclusif
              </h4>
              <p className="text-gray-600">
                Fiches pédagogiques premium créées spécialement par Marine Alves, 
                non disponibles ailleurs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">
                Mises à jour régulières
              </h4>
              <p className="text-gray-600">
                Nouvelles ressources ajoutées chaque semaine, 
                toujours en phase avec les programmes scolaires.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">
                Accompagnement Personnalisé
              </h4>
              <p className="text-gray-600">
                Conseils et guidance directement de Marine Alves 
                pour accompagner votre enfant.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="text-center mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Ce que disent nos membres Premium
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardContent>
                <p className="text-gray-600 italic mb-4">
                  "Les fiches premium ont transformé nos révisions à la maison. 
                  Ma fille de CE1 adore les exercices et progresse rapidement !"
                </p>
                <div className="flex items-center">
                  <div className="bg-rose-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                    <span className="text-rose-600 font-semibold">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sarah M.</p>
                    <p className="text-sm text-gray-600">Maman de Léa, CE1</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <CardContent>
                <p className="text-gray-600 italic mb-4">
                  "L'approche bienveillante de Marine se ressent dans chaque fiche. 
                  Mon fils reprend confiance en lui grâce à ces exercices."
                </p>
                <div className="flex items-center">
                  <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                    <span className="text-orange-600 font-semibold">T</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Thomas D.</p>
                    <p className="text-sm text-gray-600">Papa de Lucas, CM2</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Prêt à transformer l'apprentissage de votre enfant ?
          </h3>
          <p className="text-xl text-yellow-100 mb-8">
            Rejoignez plus de 1000 familles qui font confiance à L'École des Génies
          </p>
          
          {!user && (
            <Button 
              onClick={() => setCurrentView('auth')}
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-50 px-8 py-6 text-lg font-semibold"
            >
              Commencer gratuitement
            </Button>
          )}
          
          {user && !user.is_premium && (
            <Button 
              onClick={handleSubscription}
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-50 px-8 py-6 text-lg font-semibold"
            >
              <Crown className="mr-2 h-5 w-5" />
              Passer Premium maintenant
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // Password reset functions

  const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('create');
    
    useEffect(() => {
      if (user && user.is_admin) {
        fetchAdminStats();
        fetchAdminSheets();
      }
    }, [user?.is_admin, fetchAdminStats, fetchAdminSheets]);

    if (!user || !user.is_admin) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
          <Header />
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Card className="p-12 text-center">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès Admin Requis</h2>
              <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Espace Administrateur
            </h2>
            <p className="text-gray-600">
              Gérez le contenu et consultez les statistiques de la plateforme
            </p>
          </div>

          {/* Stats Dashboard */}
          {adminStats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Utilisateurs totaux</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.users.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Membres Premium</p>
                    <p className="text-2xl font-bold text-yellow-600">{adminStats.users.premium}</p>
                  </div>
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Fiches totales</p>
                    <p className="text-2xl font-bold text-green-600">{adminStats.sheets.total}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Professeurs vérifiés</p>
                    <p className="text-2xl font-bold text-purple-600">{adminStats.users.verified_teachers}</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>
          )}

          {/* Custom Tab System */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 rounded-lg">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'create'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Créer une fiche
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'manage'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Gérer les fiches
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'users'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Gestion utilisateurs
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'create' && (
                <Card className="p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-900">
                      Créer une nouvelle fiche pédagogique
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createSheet} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="title">Titre</Label>
                          <Input
                            id="title"
                            value={newSheet.title}
                            onChange={(e) => setNewSheet(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Ex: Les fractions - CM2"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="level">Niveau</Label>
                          <Select
                            value={newSheet.level}
                            onValueChange={(value) => setNewSheet(prev => ({ ...prev, level: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEVELS.map(level => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <textarea
                          id="description"
                          value={newSheet.description}
                          onChange={(e) => setNewSheet(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md resize-none"
                          rows="3"
                          placeholder="Décrivez le contenu de la fiche..."
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor="subject">Matière</Label>
                          <Select
                            value={newSheet.subject}
                            onValueChange={(value) => setNewSheet(prev => ({ ...prev, subject: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBJECTS.map(subject => (
                                <SelectItem key={subject} value={subject}>
                                  {subject.charAt(0).toUpperCase() + subject.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="is_premium"
                              checked={newSheet.is_premium}
                              onChange={(e) => setNewSheet(prev => ({ ...prev, is_premium: e.target.checked }))}
                            />
                            <Label htmlFor="is_premium">Premium</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="is_teacher_only"
                              checked={newSheet.is_teacher_only}
                              onChange={(e) => setNewSheet(prev => ({ ...prev, is_teacher_only: e.target.checked }))}
                            />
                            <Label htmlFor="is_teacher_only">Professeurs uniquement</Label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="file">Fichier PDF</Label>
                        <Input
                          id="file"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setNewSheet(prev => ({ ...prev, file: e.target.files[0] }))}
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                        disabled={!newSheet.file}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Créer la fiche
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'manage' && (
                <Card className="p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-900">
                      Gérer les fiches pédagogiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {adminSheets.map(sheet => (
                        <div key={sheet.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{sheet.title}</h3>
                              <Badge variant="outline">{sheet.level}</Badge>
                              {sheet.is_premium && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                  Premium
                                </Badge>
                              )}
                              {sheet.is_teacher_only && (
                                <Badge variant="secondary">Professeurs</Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">{sheet.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {sheet.subject} • Créé le {new Date(sheet.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(sheet.file_url)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSheet(sheet.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {adminSheets.length === 0 && (
                        <div className="text-center py-12">
                          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Aucune fiche créée
                          </h3>
                          <p className="text-gray-600">
                            Commencez par créer votre première fiche pédagogique
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'users' && (
                <Card className="p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-gray-900">
                      Réinitialisation de mot de passe
                    </CardTitle>
                    <p className="text-gray-600">
                      Réinitialisez le mot de passe d'un utilisateur
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">Réinitialisation rapide</h4>
                        <div className="space-y-4">
                          <Button
                            onClick={() => resetUserPassword('Marine.alves1995@gmail.com', 'Marine77')}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          >
                            Réinitialiser mon mot de passe → Marine77
                          </Button>
                          <p className="text-sm text-yellow-700">
                            Ceci réinitialisera le mot de passe de Marine.alves1995@gmail.com à "Marine77"
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Réinitialisation personnalisée</h4>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const email = formData.get('email');
                          const password = formData.get('password');
                          resetUserPassword(email, password);
                          e.target.reset();
                        }} className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="reset-email">Email utilisateur</Label>
                              <Input
                                id="reset-email"
                                name="email"
                                type="email"
                                placeholder="utilisateur@example.com"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="reset-password">Nouveau mot de passe</Label>
                              <Input
                                id="reset-password"
                                name="password"
                                type="text"
                                placeholder="NouveauMotDePasse123"
                                required
                              />
                            </div>
                          </div>
                          <Button 
                            type="submit"
                            variant="outline"
                            className="border-rose-300 text-rose-600 hover:bg-rose-50"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Réinitialiser le mot de passe
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ResetPasswordPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <Card className="w-full max-w-md p-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Nouveau mot de passe
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Choisissez un nouveau mot de passe sécurisé
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Votre nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Minimum 6 caractères
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                disabled={!resetToken || newPassword.length < 6}
              >
                Réinitialiser le mot de passe
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => {
                  setCurrentView('auth');
                  setAuthMode('login');
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="text-rose-600"
              >
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ContactPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Contactez-nous
          </h2>
          <p className="text-xl text-gray-600">
            Une question ? Nous sommes là pour vous aider
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-rose-100">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Nous écrire
              </h3>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="contact-name">Nom complet</Label>
                  <Input id="contact-name" placeholder="Votre nom" />
                </div>
                <div>
                  <Label htmlFor="contact-email">Email</Label>
                  <Input id="contact-email" type="email" placeholder="votre@email.com" />
                </div>
                <div>
                  <Label htmlFor="contact-subject">Sujet</Label>
                  <Input id="contact-subject" placeholder="Objet de votre message" />
                </div>
                <div>
                  <Label htmlFor="contact-message">Message</Label>
                  <textarea 
                    id="contact-message"
                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                    rows="5"
                    placeholder="Votre message..."
                  ></textarea>
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                >
                  Envoyer le message
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Informations pratiques
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-rose-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Temps de réponse</p>
                      <p className="text-gray-600">Nous répondons sous 24-48h</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-rose-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Support dédié</p>
                      <p className="text-gray-600">Parents et professeurs</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Questions fréquentes
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Comment devenir membre premium ?</p>
                    <p className="text-gray-600">Connectez-vous et cliquez sur "Passer Premium"</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Validation du statut professeur ?</p>
                    <p className="text-gray-600">Téléchargez votre justificatif dans votre espace</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      {alert.show && (
        <Alert className={`fixed top-4 right-4 z-50 max-w-md ${
          alert.type === 'error' ? 'border-red-500 bg-red-50' : 
          alert.type === 'success' ? 'border-green-500 bg-green-50' : 
          'border-blue-500 bg-blue-50'
        }`}>
          <AlertDescription className={
            alert.type === 'error' ? 'text-red-700' : 
            alert.type === 'success' ? 'text-green-700' : 
            'text-blue-700'
          }>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {currentView === 'home' && <HomePage />}
      {currentView === 'auth' && <AuthPage />}
      {currentView === 'dashboard' && user && <DashboardPage />}
      {currentView === 'premium' && <PremiumPage />}
      {currentView === 'admin' && <AdminPage />}
      {currentView === 'reset-password' && <ResetPasswordPage />}
      {currentView === 'about' && <AboutPage />}
      {currentView === 'contact' && <ContactPage />}
    </div>
  );
}

export default App;