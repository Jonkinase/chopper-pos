import React, { useState, useEffect } from 'react';
import { configApi } from '../../api/config.api';
import { useConfigStore } from '../../store/configStore';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Building, FileText, Save, Trash2, Upload, Loader2 } from 'lucide-react';

const ConfigPage = () => {
  const { config, fetchConfig, updateConfig } = useConfigStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, banner: false });

  // Text fields state
  const [formData, setFormData] = useState({
    company_name: '',
    company_cuit: '',
    company_address: '',
    company_phone: '',
    pdf_footer_message: '',
    pdf_banner_validity: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (config) {
      setFormData({
        company_name: config.company_name || '',
        company_cuit: config.company_cuit || '',
        company_address: config.company_address || '',
        company_phone: config.company_phone || '',
        pdf_footer_message: config.pdf_footer_message || '',
        pdf_banner_validity: config.pdf_banner_validity || ''
      });
    }
  }, [config]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveText = async () => {
    setLoading(true);
    try {
      await configApi.update(formData);
      updateConfig(formData);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('El archivo es demasiado grande (máx 5MB)');
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const res = type === 'logo' 
        ? await configApi.uploadLogo(file)
        : await configApi.uploadBanner(file);
      
      const key = type === 'logo' ? 'sidebar_logo_path' : 'pdf_banner_path';
      updateConfig({ [key]: res.data.data.path });
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} actualizado`);
    } catch (error) {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDeleteFile = async (type) => {
    try {
      if (type === 'logo') await configApi.deleteLogo();
      else await configApi.deleteBanner();
      
      const key = type === 'logo' ? 'sidebar_logo_path' : 'pdf_banner_path';
      updateConfig({ [key]: null });
      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} eliminado`);
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const getFullUrl = (path) => path ? `http://localhost:3000${path}` : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configuración General</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Personaliza la identidad visual y datos de tu sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: IDENTIDAD VISUAL */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-primary-500" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Identidad Visual</h2>
          </div>
          <div className="p-6 space-y-8">
            {/* Logo System */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Logo del Sistema (Sidebar)</label>
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                  {config.sidebar_logo_path ? (
                    <img src={getFullUrl(config.sidebar_logo_path)} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="cursor-pointer bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2">
                    {uploading.logo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{config.sidebar_logo_path ? 'Cambiar Logo' : 'Subir Logo'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('logo', e.target.files[0])} />
                  </label>
                  {config.sidebar_logo_path && (
                    <button onClick={() => handleDeleteFile('logo')} className="text-red-500 hover:text-red-600 text-xs font-medium flex items-center justify-center space-x-1">
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar actual</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Banner PDF */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Banner para Documentos PDF</label>
              <div className="space-y-3">
                <div className="aspect-[5/1] w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                  {config.pdf_banner_path ? (
                    <img src={getFullUrl(config.pdf_banner_path)} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-500">Ratio sugerido 5:1 (ej: 1000x200px)</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer text-primary-500 hover:text-primary-400 text-sm font-bold transition-colors flex items-center space-x-2">
                    {uploading.banner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{config.pdf_banner_path ? 'Cambiar Banner' : 'Subir Banner'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('banner', e.target.files[0])} />
                  </label>
                  {config.pdf_banner_path && (
                    <button onClick={() => handleDeleteFile('banner')} className="text-red-500 hover:text-red-600 text-xs font-medium flex items-center space-x-1">
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: DATOS DE EMPRESA */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary-500" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Datos de la Empresa</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nombre / Razón Social</label>
              <input type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Nombre de tu negocio" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">CUIT</label>
              <input type="text" name="company_cuit" value={formData.company_cuit} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="00-00000000-0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Dirección (Casa Central)</label>
              <input type="text" name="company_address" value={formData.company_address} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Av. Principal 123" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Teléfono de Contacto</label>
              <input type="text" name="company_phone" value={formData.company_phone} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="+54 9..." />
            </div>
            <p className="text-[10px] text-slate-500 italic mt-4">Los campos vacíos no aparecerán en los documentos PDF.</p>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={handleSaveText} disabled={loading} className="w-full bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center space-x-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>

      {/* CARD 3: TEXTOS PDF */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-primary-500" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Textos Legales y Documentos</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Mensaje Pie de Página (Footer)</label>
            <textarea name="pdf_footer_message" value={formData.pdf_footer_message} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Gracias por su preferencia..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Texto de Validez / Banner Secundario</label>
            <textarea name="pdf_banner_validity" value={formData.pdf_banner_validity} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Presupuesto válido por 30 días..." />
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button onClick={handleSaveText} disabled={loading} className="px-8 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center space-x-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Actualizar Textos</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;
