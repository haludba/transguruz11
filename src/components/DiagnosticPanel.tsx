import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  RefreshCw, 
  Wrench, 
  Terminal,
  Network,
  Shield,
  Code,
  Server,
  Clock,
  Loader
} from 'lucide-react';
import { 
  diagnostics, 
  type SystemStatus, 
  type DiagnosticResult 
} from '../utils/diagnostics';

interface DiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ isOpen, onClose }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixResults, setAutoFixResults] = useState<DiagnosticResult[]>([]);

  // Запуск диагностики при открытии панели
  useEffect(() => {
    if (isOpen && !systemStatus) {
      runDiagnostics();
    }
  }, [isOpen]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setSystemStatus(null);
    setAutoFixResults([]);
    
    try {
      const status = await diagnostics.runFullDiagnostics();
      setSystemStatus(status);
    } catch (error) {
      console.error('Ошибка диагностики:', error);
      setSystemStatus({
        overall: 'critical',
        results: [{
          category: 'Система',
          status: 'error',
          message: 'Критическая ошибка диагностики',
          details: `${error}`,
          solution: 'Попробуйте перезагрузить страницу'
        }],
        timestamp: Date.now()
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAutoFix = async () => {
    setIsAutoFixing(true);
    
    try {
      const results = await diagnostics.autoFix();
      setAutoFixResults(results);
      
      // Перезапускаем диагностику после автоисправления
      setTimeout(() => {
        runDiagnostics();
      }, 1000);
    } catch (error) {
      console.error('Ошибка автоисправления:', error);
      setAutoFixResults([{
        category: 'Автоисправление',
        status: 'error',
        message: 'Не удалось выполнить автоисправление',
        details: `${error}`
      }]);
    } finally {
      setIsAutoFixing(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'зависимости':
        return <Code className="w-4 h-4" />;
      case 'конфигурация':
      case 'стили':
        return <Settings className="w-4 h-4" />;
      case 'api токены':
        return <Shield className="w-4 h-4" />;
      case 'совместимость':
        return <CheckCircle className="w-4 h-4" />;
      case 'сеть':
        return <Network className="w-4 h-4" />;
      case 'javascript':
        return <Code className="w-4 h-4" />;
      case 'dev сервер':
      case 'порты':
        return <Server className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getOverallStatusColor = (status: SystemStatus['overall']) => {
    switch (status) {
      case 'healthy':
        return 'from-green-500 to-emerald-500';
      case 'warning':
        return 'from-yellow-500 to-orange-500';
      case 'critical':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getOverallStatusText = (status: SystemStatus['overall']) => {
    switch (status) {
      case 'healthy':
        return 'Система работает нормально';
      case 'warning':
        return 'Обнаружены предупреждения';
      case 'critical':
        return 'Обнаружены критические ошибки';
      default:
        return 'Статус неизвестен';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-70 bg-gray-800 animate-in slide-in-from-right-0 duration-300 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-gray-800/95 backdrop-blur-md border-b border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Диагностика системы</h2>
                <p className="text-gray-400">Анализ проблем запуска приложения</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={runDiagnostics}
                disabled={isRunning}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                title="Перезапустить диагностику"
              >
                <RefreshCw className={`w-5 h-5 text-gray-300 ${isRunning ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-200"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading State */}
          {isRunning && (
            <div className="bg-gray-700/50 rounded-xl p-6 text-center animate-in slide-in-from-bottom-4">
              <Loader className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Выполняется диагностика</h3>
              <p className="text-gray-400 text-sm">Проверяем все компоненты системы...</p>
            </div>
          )}

          {/* Overall Status */}
          {systemStatus && !isRunning && (
            <div className={`bg-gradient-to-r ${getOverallStatusColor(systemStatus.overall)} rounded-xl p-6 text-white animate-in slide-in-from-bottom-4`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {systemStatus.overall === 'healthy' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : systemStatus.overall === 'warning' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{getOverallStatusText(systemStatus.overall)}</h3>
                  <p className="text-white/80 text-sm">
                    Проверено {systemStatus.results.length} компонентов • 
                    {new Date(systemStatus.timestamp).toLocaleTimeString('ru-RU')}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">
                    {systemStatus.results.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-white/80">Успешно</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {systemStatus.results.filter(r => r.status === 'warning').length}
                  </div>
                  <div className="text-sm text-white/80">Предупреждения</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {systemStatus.results.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-white/80">Ошибки</div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-fix Section */}
          {systemStatus && (systemStatus.overall === 'warning' || systemStatus.overall === 'critical') && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-cyan-400 font-semibold">Автоматическое исправление</h3>
                  <p className="text-gray-400 text-sm">Попробуйте исправить некоторые проблемы автоматически</p>
                </div>
              </div>
              
              <button
                onClick={runAutoFix}
                disabled={isAutoFixing}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAutoFixing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Исправление...</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-5 h-5" />
                    <span>Запустить автоисправление</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Auto-fix Results */}
          {autoFixResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                Результаты автоисправления
              </h3>
              {autoFixResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    result.status === 'success' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : result.status === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{result.message}</h4>
                      {result.details && (
                        <p className="text-gray-400 text-sm mt-1">{result.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Diagnostic Results */}
          {systemStatus && !isRunning && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Подробные результаты</h3>
              
              {/* Group results by category */}
              {Object.entries(
                systemStatus.results.reduce((acc, result) => {
                  if (!acc[result.category]) acc[result.category] = [];
                  acc[result.category].push(result);
                  return acc;
                }, {} as Record<string, DiagnosticResult[]>)
              ).map(([category, results]) => (
                <div key={category} className="bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {getCategoryIcon(category)}
                    <h4 className="text-white font-medium">{category}</h4>
                    <span className="text-xs text-gray-400">
                      ({results.length} {results.length === 1 ? 'проверка' : 'проверок'})
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.status === 'success' 
                            ? 'bg-green-500/10 border-green-500/20' 
                            : result.status === 'warning'
                            ? 'bg-yellow-500/10 border-yellow-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <h5 className="text-white font-medium text-sm">{result.message}</h5>
                            {result.details && (
                              <p className="text-gray-400 text-xs mt-1 leading-relaxed">{result.details}</p>
                            )}
                            {result.solution && (
                              <div className="mt-2 p-2 bg-gray-600/50 rounded border-l-2 border-cyan-400">
                                <p className="text-cyan-300 text-xs font-medium">Решение:</p>
                                <p className="text-gray-300 text-xs">{result.solution}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {systemStatus && !isRunning && (
            <div className="bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                Быстрые действия
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Перезагрузить страницу</span>
                </button>
                
                <button
                  onClick={() => {
                    // Очистить кэш и перезагрузить
                    if ('caches' in window) {
                      caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                      }).then(() => window.location.reload());
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Очистить кэш</span>
                </button>
              </div>
            </div>
          )}

          {/* Development Instructions */}
          <div className="bg-gray-700/30 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-green-400" />
              Инструкции для разработчика
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-green-400 font-medium mb-2">1. Проверьте терминал</h4>
                <p className="text-gray-300 mb-2">
                  Убедитесь, что dev сервер запущен и работает без ошибок:
                </p>
                <div className="bg-gray-800 rounded-lg p-3 font-mono text-cyan-300">
                  npm run dev
                </div>
              </div>
              
              <div>
                <h4 className="text-yellow-400 font-medium mb-2">2. Переустановите зависимости</h4>
                <p className="text-gray-300 mb-2">
                  Если есть проблемы с модулями, переустановите зависимости:
                </p>
                <div className="bg-gray-800 rounded-lg p-3 font-mono text-cyan-300 space-y-1">
                  <div>rm -rf node_modules package-lock.json</div>
                  <div>npm install</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-blue-400 font-medium mb-2">3. Проверьте консоль браузера</h4>
                <p className="text-gray-300">
                  Откройте DevTools (F12) и проверьте вкладку Console на наличие ошибок JavaScript.
                </p>
              </div>
              
              <div>
                <h4 className="text-purple-400 font-medium mb-2">4. Проверьте порты</h4>
                <p className="text-gray-300">
                  Убедитесь, что порт не занят другим приложением. Vite обычно использует порты 5173, 5174, 5175.
                </p>
              </div>
            </div>
          </div>

          {/* Common Issues */}
          <div className="bg-gray-700/30 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Распространённые проблемы
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="text-red-400 font-medium mb-1">Ошибки компиляции TypeScript</h4>
                <p className="text-gray-300 text-xs">Проверьте типы данных и импорты в файлах .ts/.tsx</p>
              </div>
              
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h4 className="text-yellow-400 font-medium mb-1">Проблемы с Mapbox токеном</h4>
                <p className="text-gray-300 text-xs">Убедитесь, что токен Mapbox действителен и не превышен лимит запросов</p>
              </div>
              
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-1">Конфликты зависимостей</h4>
                <p className="text-gray-300 text-xs">Возможны версионные конфликты между пакетами</p>
              </div>
              
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h4 className="text-purple-400 font-medium mb-1">Проблемы с CORS</h4>
                <p className="text-gray-300 text-xs">Некоторые внешние ресурсы могут блокироваться политикой CORS</p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-gray-700/30 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Информация о системе
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Браузер:</span>
                  <span className="text-white">{navigator.userAgent.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Платформа:</span>
                  <span className="text-white">{navigator.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">WebGL:</span>
                  <span className="text-white">
                    {(() => {
                      const canvas = document.createElement('canvas');
                      const gl = canvas.getContext('webgl');
                      return gl ? 'Поддерживается' : 'Не поддерживается';
                    })()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Geolocation:</span>
                  <span className="text-white">
                    {navigator.geolocation ? 'Доступно' : 'Недоступно'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">HTTPS:</span>
                  <span className="text-white">
                    {window.location.protocol === 'https:' ? 'Да' : 'Нет'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Время:</span>
                  <span className="text-white">
                    {new Date().toLocaleTimeString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiagnosticPanel;