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
  X
} from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sheets, setSheets] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filters, setFilters] = useState({ level: 'all', subject: 'all' });
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    userType: 'parent'
  });
  const [authMode, setAuthMode] = useState('login');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [verificationFile, setVerificationFile] = useState(null);

  const levels = ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'];
  const subjects = ['mathématiques', 'français', 'sciences', 'découverte du monde', 'histoire', 'géographie'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSheets();
    }
  }, [user, filters]);

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 5000);
  };

  const handleAuthFormChange = useCallback((field, value) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFirstNameChange = useCallback((e) => {
    handleAuthFormChange('firstName', e.target.value);
  }, [handleAuthFormChange]);

  const handleLastNameChange = useCallback((e) => {
    handleAuthFormChange('lastName', e.target.value);
  }, [handleAuthFormChange]);

  const handleEmailChange = useCallback((e) => {
    handleAuthFormChange('email', e.target.value);
  }, [handleAuthFormChange]);

  const handlePasswordChange = useCallback((e) => {
    handleAuthFormChange('password', e.target.value);
  }, [handleAuthFormChange]);

  const handleUserTypeChange = useCallback((value) => {
    handleAuthFormChange('userType', value);
  }, [handleAuthFormChange]);

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

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'login' ? 'login' : 'register';
      const payload = authMode === 'login' 
        ? { email: authForm.email, password: authForm.password }
        : {
            email: authForm.email,
            password: authForm.password,
            first_name: authForm.firstName,
            last_name: authForm.lastName,
            user_type: authForm.userType
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
              {authMode === 'login' ? 'Connexion' : 'Inscription'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
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
                        value={authForm.firstName}
                        onChange={(e) => handleAuthFormChange('firstName', e.target.value)}
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
                        value={authForm.lastName}
                        onChange={(e) => handleAuthFormChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="userType">Je suis</Label>
                    <Select
                      value={authForm.userType}
                      onValueChange={(value) => handleAuthFormChange('userType', value)}
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
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  value={authForm.email}
                  onChange={(e) => handleAuthFormChange('email', e.target.value)}
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
                  value={authForm.password}
                  onChange={(e) => handleAuthFormChange('password', e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
              >
                {authMode === 'login' ? 'Se connecter' : 'S\'inscrire'}
              </Button>
            </form>

            <div className="mt-6 text-center">
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
                    {levels.map(level => (
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
                    {subjects.map(subject => (
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
      {currentView === 'about' && <AboutPage />}
      {currentView === 'contact' && <ContactPage />}
    </div>
  );
}

export default App;