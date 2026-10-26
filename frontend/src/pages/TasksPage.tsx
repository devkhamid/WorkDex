import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Building2 } from 'lucide-react';
import { projectsApi } from '../api/services';
import { Project, ProjectTask } from '../types';

export const TasksPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<{ project: Project; task: ProjectTask }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const projs = await projectsApi.getAll();
      setProjects(projs);

      const allTasks: { project: Project; task: ProjectTask }[] = [];
      for (const p of projs) {
        const tList = await projectsApi.getTasks(p.id);
        tList.forEach(t => allTasks.push({ project: p, task: t }));
      }
      setTasks(allTasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (projectId: string, taskId: string) => {
    try {
      await projectsApi.toggleTaskComplete(projectId, taskId);
      loadTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const pending = tasks.filter(x => !x.task.isCompleted);
  const completed = tasks.filter(x => x.task.isCompleted);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#171b25]">Barcha Vazifalar</h2>
        <p className="text-xs text-[#7b8190] mt-0.5 break-words">Barcha faol loyihalardagi ishlar va topshiriqlar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-xs text-[#171b25]">Bajarilishi Kerak</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#ff7a16]">
              {pending.length} ta
            </span>
          </div>

          <div className="space-y-2">
            {pending.map(({ project, task }) => (
              <div
                key={task.id}
                onClick={() => handleToggle(project.id, task.id)}
                className="p-3 bg-gray-50/70 border border-gray-200 rounded-lg flex items-start sm:items-center justify-between gap-3 cursor-pointer hover:border-orange-300 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center bg-white" />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-gray-900 break-words">{task.title}</div>
                    <div className="text-[10px] text-gray-500">{project.name} · {task.stageName || 'Bosqichsiz'}</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 flex-shrink-0 whitespace-nowrap">
                  {task.weight} ball
                </span>
              </div>
            ))}
            {pending.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">Bajarilishi kerak bo'lgan vazifa yo'q</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-xs text-[#171b25]">Yakunlangan Vazifalar</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {completed.length} ta
            </span>
          </div>

          <div className="space-y-2">
            {completed.map(({ project, task }) => (
              <div
                key={task.id}
                onClick={() => handleToggle(project.id, task.id)}
                className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-lg flex items-start sm:items-center justify-between gap-3 cursor-pointer hover:brightness-95 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded border border-emerald-600 bg-emerald-600 flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-gray-700 line-through break-words">{task.title}</div>
                    <div className="text-[10px] text-gray-400">{project.name}</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold flex-shrink-0 whitespace-nowrap">Bajarildi ✓</span>
              </div>
            ))}
            {completed.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">Yakunlangan vazifalar mavjud emas</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
