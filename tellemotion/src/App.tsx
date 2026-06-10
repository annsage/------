import { Component, ReactNode, ErrorInfo } from 'react';
import useAppStore from './store/useAppStore';
import EntryScreen from './components/EntryScreen';
import StudentDashboard from './components/StudentDashboard';
import HelperDashboard from './components/HelperDashboard';
import MountainDashboard from './components/MountainDashboard';

// 백엔드 연동 가이드 (Python 예시 - f-string 사용 금지)
// 파이썬 기반 서버 구동 시 예외 처리는 아래와 같이 작성합니다.
// try:
//     init_firebase()
// except Exception as e:
//     print("Firebase 연결 오류 발생: {}".format(e))

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("앱 실행 중 에러 발생:", error, errorInfo);
    this.setState({ errorMessage: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-white p-10 rounded-3xl shadow-xl border-4 border-red-200 max-w-lg">
            <h1 className="text-4xl mb-4">🚨</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">앗, 뭔가 문제가 생겼어요!</h2>
            <p className="text-gray-600 font-medium mb-6">
              네트워크 연결이 끊어졌거나 서버에 일시적인 오류가 있을 수 있어요.
              잠시 후 다시 시도해 주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-2xl w-full transition-all"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const currentScreen = useAppStore((state) => state.currentScreen);

  let Content;
  switch (currentScreen) {
    case 'STUDENT_DASHBOARD':
      Content = <StudentDashboard />;
      break;
    case 'HELPER_DASHBOARD':
      Content = <HelperDashboard />;
      break;
    case 'TEACHER_DASHBOARD':
      Content = <MountainDashboard />;
      break;
    case 'ENTRY':
    default:
      Content = <EntryScreen />;
      break;
  }

  return (
    <div className="min-h-screen bg-[var(--color-melon-base)] p-4 md:p-8 lg:p-12 flex flex-col items-center">
      {/* 상단 헤더 (Entry 스크린이 아닐 때만 표시) */}
      {currentScreen !== 'ENTRY' && (
        <header className="w-full max-w-7xl mb-8 flex items-center justify-between bg-white p-6 rounded-3xl shadow-soft border-4 border-white">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">
            말하지 않아도 통하는, 텔레모션 🌿
          </h1>
          <button 
            onClick={() => window.location.reload()}
            className="text-gray-500 hover:text-gray-800 font-bold px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            처음으로
          </button>
        </header>
      )}

      {/* 메인 콘텐츠 영역 (유연한 그리드/플렉스 레이아웃) */}
      <main className={`w-full ${currentScreen === 'ENTRY' ? 'max-w-full' : 'max-w-7xl'} flex-1 flex flex-col justify-center`}>
        {Content}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
