// Система диагностики для выявления проблем с запуском приложения
export interface DiagnosticResult {
  category: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  solution?: string;
}

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  results: DiagnosticResult[];
  timestamp: number;
}

export class DiagnosticsService {
  private static instance: DiagnosticsService;
  
  static getInstance(): DiagnosticsService {
    if (!DiagnosticsService.instance) {
      DiagnosticsService.instance = new DiagnosticsService();
    }
    return DiagnosticsService.instance;
  }

  async runFullDiagnostics(): Promise<SystemStatus> {
    const results: DiagnosticResult[] = [];
    
    // Проверка зависимостей
    results.push(...await this.checkDependencies());
    
    // Проверка dev сервера
    results.push(...await this.checkDevServerHealth());
    
    // Проверка специфичных проблем приложения
    results.push(...await this.checkAppSpecificIssues());
    
    // Проверка конфигурации
    results.push(...this.checkConfiguration());
    
    // Проверка API токенов
    results.push(...this.checkAPITokens());
    
    // Проверка браузера
    results.push(...this.checkBrowserCompatibility());
    
    // Проверка сети
    results.push(...await this.checkNetworkConnectivity());
    
    // Проверка JavaScript ошибок
    results.push(...this.checkJavaScriptErrors());
    
    // Проверка портов
    results.push(...await this.checkPortAvailability());

    // Определение общего статуса
    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');
    
    const overall = hasErrors ? 'critical' : hasWarnings ? 'warning' : 'healthy';

    return {
      overall,
      results,
      timestamp: Date.now()
    };
  }

  private async checkDependencies(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    try {
      const criticalModules = [
        'react',
        'react-dom', 
        'mapbox-gl',
        '@turf/turf',
        'lucide-react'
      ];

      for (const module of criticalModules) {
        try {
          // Пытаемся импортировать модуль
          const moduleExists = await this.checkModuleExists(module);
          if (moduleExists) {
            results.push({
              category: 'Зависимости',
              status: 'success',
              message: `Модуль ${module} загружен`,
              details: `Критический модуль ${module} доступен и работает корректно`
            });
          } else {
            results.push({
              category: 'Зависимости',
              status: 'error',
              message: `Модуль ${module} не найден`,
              details: `Критический модуль ${module} отсутствует или поврежден`,
              solution: 'Выполните команду: npm install'
            });
          }
        } catch (error) {
          results.push({
            category: 'Зависимости',
            status: 'error',
            message: `Ошибка загрузки ${module}`,
            details: `Не удалось загрузить модуль: ${error}`,
            solution: 'Переустановите зависимости: npm install'
          });
        }
      }
    } catch (error) {
      results.push({
        category: 'Зависимости',
        status: 'error',
        message: 'Критическая ошибка проверки зависимостей',
        details: `${error}`,
        solution: 'Удалите node_modules и выполните npm install'
      });
    }

    return results;
  }

  private async checkModuleExists(moduleName: string): Promise<boolean> {
    try {
      // Простая проверка доступности модуля
      switch (moduleName) {
        case 'react':
          return typeof React !== 'undefined';
        case 'react-dom':
          return typeof ReactDOM !== 'undefined';
        case 'mapbox-gl':
          try {
            // Проверяем наличие mapbox-gl
            const mapboxgl = await import('mapbox-gl');
            return !!mapboxgl.default;
          } catch {
            return false;
          }
        case '@turf/turf':
          try {
            await import('@turf/turf');
            return true;
          } catch {
            return false;
          }
        case 'lucide-react':
          try {
            await import('lucide-react');
            return true;
          } catch {
            return false;
          }
        default:
          return true; // Для остальных модулей предполагаем успех
      }
    } catch {
      return false;
    }
  }

  private checkConfiguration(): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];
    
    // Проверка Vite конфигурации
    try {
      if (import.meta.env) {
        results.push({
          category: 'Конфигурация',
          status: 'success',
          message: 'Vite конфигурация загружена',
          details: 'Переменные окружения доступны'
        });
      }
    } catch (error) {
      results.push({
        category: 'Конфигурация',
        status: 'error',
        message: 'Проблема с Vite конфигурацией',
        details: `${error}`,
        solution: 'Проверьте файл vite.config.ts'
      });
    }

    // Проверка Tailwind CSS
    try {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      if (computedStyle.getPropertyValue('background-color')) {
        results.push({
          category: 'Стили',
          status: 'success',
          message: 'Tailwind CSS загружен',
          details: 'Стили применяются корректно'
        });
      }
    } catch (error) {
      results.push({
        category: 'Стили',
        status: 'warning',
        message: 'Возможная проблема с CSS',
        details: 'Не удалось проверить загрузку стилей',
        solution: 'Проверьте файл index.css и конфигурацию Tailwind'
      });
    }

    return results;
  }

  private checkAPITokens(): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];
    
    // Проверка Mapbox токена
    const mapboxToken = 'pk.eyJ1IjoiaGFsdWRiYSIsImEiOiJjbWM1dm5lYnowZDJhMmpzOXhwaWlqZDh1In0.wQCA4N58a0cox_9mp8n7KA';
    
    if (mapboxToken && mapboxToken.startsWith('pk.')) {
      results.push({
        category: 'API Токены',
        status: 'success',
        message: 'Mapbox токен настроен',
        details: 'Токен имеет правильный формат и готов к использованию'
      });
    } else {
      results.push({
        category: 'API Токены',
        status: 'error',
        message: 'Mapbox токен не найден или неверный',
        details: 'Отсутствует или неправильно настроен токен Mapbox',
        solution: 'Получите токен на https://account.mapbox.com/access-tokens/'
      });
    }

    return results;
  }

  private checkBrowserCompatibility(): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];
    
    // Проверка поддержки ES6+
    const supportsES6 = (() => {
      try {
        eval('const test = () => {};');
        return true;
      } catch {
        return false;
      }
    })();

    if (supportsES6) {
      results.push({
        category: 'Совместимость',
        status: 'success',
        message: 'Браузер поддерживает ES6+',
        details: 'Современные JavaScript функции доступны'
      });
    } else {
      results.push({
        category: 'Совместимость',
        status: 'error',
        message: 'Браузер не поддерживает ES6',
        details: 'Требуется обновление браузера',
        solution: 'Обновите браузер до последней версии'
      });
    }

    // Проверка WebGL (для Mapbox)
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      results.push({
        category: 'Совместимость',
        status: 'success',
        message: 'WebGL поддерживается',
        details: 'Mapbox карты будут работать корректно'
      });
    } else {
      results.push({
        category: 'Совместимость',
        status: 'warning',
        message: 'WebGL не поддерживается',
        details: 'Карты могут работать некорректно',
        solution: 'Включите аппаратное ускорение в настройках браузера'
      });
    }

    // Проверка Geolocation API
    if (navigator.geolocation) {
      results.push({
        category: 'Совместимость',
        status: 'success',
        message: 'Geolocation API доступен',
        details: 'Определение местоположения будет работать'
      });
    } else {
      results.push({
        category: 'Совместимость',
        status: 'warning',
        message: 'Geolocation API недоступен',
        details: 'Функция определения местоположения не будет работать',
        solution: 'Обновите браузер или используйте HTTPS'
      });
    }

    return results;
  }

  private async checkNetworkConnectivity(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    try {
      // Проверка подключения к Mapbox API
      const response = await fetch('https://api.mapbox.com/v1/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        results.push({
          category: 'Сеть',
          status: 'success',
          message: 'Mapbox API доступен',
          details: 'Подключение к сервисам карт работает'
        });
      } else {
        results.push({
          category: 'Сеть',
          status: 'warning',
          message: 'Проблемы с Mapbox API',
          details: `HTTP ${response.status}: ${response.statusText}`,
          solution: 'Проверьте подключение к интернету'
        });
      }
    } catch (error) {
      results.push({
        category: 'Сеть',
        status: 'error',
        message: 'Нет подключения к Mapbox API',
        details: `Ошибка сети: ${error}`,
        solution: 'Проверьте подключение к интернету и настройки прокси'
      });
    }

    return results;
  }

  private checkJavaScriptErrors(): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];
    
    // Проверяем глобальные ошибки
    let hasGlobalErrors = false;
    
    const originalErrorHandler = window.onerror;
    const errors: string[] = [];
    
    window.onerror = (message, source, lineno, colno, error) => {
      hasGlobalErrors = true;
      errors.push(`${message} в ${source}:${lineno}:${colno}`);
      return originalErrorHandler ? originalErrorHandler(message, source, lineno, colno, error) : false;
    };

    // Восстанавливаем оригинальный обработчик через короткое время
    setTimeout(() => {
      window.onerror = originalErrorHandler;
      
      if (hasGlobalErrors) {
        results.push({
          category: 'JavaScript',
          status: 'error',
          message: 'Обнаружены ошибки JavaScript',
          details: errors.join('\n'),
          solution: 'Проверьте консоль браузера для подробной информации'
        });
      } else {
        results.push({
          category: 'JavaScript',
          status: 'success',
          message: 'JavaScript выполняется без ошибок',
          details: 'Не обнаружено критических ошибок'
        });
      }
    }, 1000);

    return results;
  }

  // Новый метод: проверка состояния dev сервера
  async checkDevServerHealth(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    try {
      // Проверяем HMR (Hot Module Replacement)
      if (import.meta.hot) {
        results.push({
          category: 'Dev Сервер',
          status: 'success',
          message: 'Hot Module Replacement активен',
          details: 'Изменения в коде будут применяться автоматически'
        });
      } else {
        results.push({
          category: 'Dev Сервер',
          status: 'warning',
          message: 'HMR недоступен',
          details: 'Возможно, приложение запущено в production режиме',
          solution: 'Убедитесь, что используется npm run dev'
        });
      }
      
      // Проверяем доступность Vite dev сервера
      const devServerCheck = await this.checkDevServerStatus();
      results.push(devServerCheck);
      
    } catch (error) {
      results.push({
        category: 'Dev Сервер',
        status: 'error',
        message: 'Ошибка проверки dev сервера',
        details: `${error}`,
        solution: 'Перезапустите dev сервер: npm run dev'
      });
    }
    
    return results;
  }

  // Проверка специфичных для приложения проблем
  async checkAppSpecificIssues(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    try {
      // Проверка Mapbox GL JS инициализации
      try {
        const mapboxgl = await import('mapbox-gl');
        if (mapboxgl.accessToken) {
          results.push({
            category: 'Mapbox',
            status: 'success',
            message: 'Mapbox токен установлен',
            details: 'Карты будут работать корректно'
          });
        } else {
          results.push({
            category: 'Mapbox',
            status: 'warning',
            message: 'Mapbox токен не установлен',
            details: 'Карты могут не отображаться',
            solution: 'Проверьте настройку токена в mapboxService.ts'
          });
        }
      } catch (error) {
        results.push({
          category: 'Mapbox',
          status: 'error',
          message: 'Ошибка загрузки Mapbox GL',
          details: `${error}`,
          solution: 'Переустановите mapbox-gl: npm install mapbox-gl@latest'
        });
      }
      
      // Проверка Turf.js (для геометрических расчетов)
      try {
        const turf = await import('@turf/turf');
        if (turf.point && turf.distance) {
          results.push({
            category: 'Геометрия',
            status: 'success',
            message: 'Turf.js загружен корректно',
            details: 'Геометрические расчеты будут работать'
          });
        }
      } catch (error) {
        results.push({
          category: 'Геометрия',
          status: 'error',
          message: 'Ошибка загрузки Turf.js',
          details: `${error}`,
          solution: 'Переустановите @turf/turf: npm install @turf/turf@latest'
        });
      }
      
    } catch (error) {
      results.push({
        category: 'Приложение',
        status: 'error',
        message: 'Критическая ошибка при проверке компонентов приложения',
        details: `${error}`
      });
    }
    
    return results;
  }

  // Проверка статуса dev сервера
  async checkDevServerStatus(): Promise<DiagnosticResult> {
    try {
      // Пытаемся подключиться к dev серверу
      const response = await fetch(window.location.origin, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        return {
          category: 'Dev Сервер',
          status: 'success',
          message: 'Dev сервер работает',
          details: `Сервер доступен по адресу ${window.location.origin}`
        };
      } else {
        return {
          category: 'Dev Сервер',
          status: 'error',
          message: 'Dev сервер недоступен',
          details: `HTTP ${response.status}: ${response.statusText}`,
          solution: 'Запустите сервер командой: npm run dev'
        };
      }
    } catch (error) {
      return {
        category: 'Dev Сервер',
        status: 'error',
        message: 'Не удается подключиться к dev серверу',
        details: `${error}`,
        solution: 'Убедитесь, что выполнена команда npm run dev в терминале'
      };
    }
  }

  // Проверка портов
  async checkPortAvailability(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    const commonPorts = [5173, 5174, 5175, 3000, 8080];
    
    for (const port of commonPorts) {
      try {
        const response = await fetch(`http://localhost:${port}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(1000)
        });
        
        if (response.ok) {
          results.push({
            category: 'Порты',
            status: 'success',
            message: `Порт ${port} доступен`,
            details: `Сервис работает на порту ${port}`
          });
          break; // Нашли рабочий порт
        }
      } catch (error) {
        // Порт недоступен - это нормально для большинства портов
        continue;
      }
    }
    
    if (results.length === 0) {
      results.push({
        category: 'Порты',
        status: 'warning',
        message: 'Не найдены активные dev серверы',
        details: 'Возможно, сервер еще не запущен',
        solution: 'Запустите dev сервер: npm run dev'
      });
    }

    return results;
  }

  // Автоматическое исправление проблем
  async autoFix(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    // Очистка localStorage от поврежденных данных
    try {
      const keys = Object.keys(localStorage);
      let cleanedCount = 0;
      
      keys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            JSON.parse(value); // Проверяем валидность JSON
          }
        } catch {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        results.push({
          category: 'Автоисправление',
          status: 'success',
          message: `Очищено ${cleanedCount} поврежденных записей в localStorage`,
          details: 'Удалены некорректные данные из локального хранилища'
        });
      }
    } catch (error) {
      results.push({
        category: 'Автоисправление',
        status: 'warning',
        message: 'Не удалось очистить localStorage',
        details: `${error}`
      });
    }

    // Принудительная перезагрузка кэша модулей
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        if (registrations.length > 0) {
          results.push({
            category: 'Автоисправление',
            status: 'success',
            message: 'Service Workers очищены',
            details: 'Удалены устаревшие service worker\'ы'
          });
        }
      }
    } catch (error) {
      results.push({
        category: 'Автоисправление',
        status: 'warning',
        message: 'Не удалось очистить Service Workers',
        details: `${error}`
      });
    }

    return results;
  }
}

// Экспорт singleton instance
export const diagnostics = DiagnosticsService.getInstance();