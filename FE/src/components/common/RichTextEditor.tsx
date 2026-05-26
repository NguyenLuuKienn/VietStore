import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/themes/silver';
import 'tinymce/models/dom';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/wordcount';
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/content/default/content.min.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = 220
}) => {
  return (
    <div className="rounded-xl border-2 border-gray-100 bg-white overflow-hidden">
      <Editor
        value={value || ''}
        onEditorChange={(content) => onChange(content)}
        init={{
          license_key: 'gpl',
          height: minHeight,
          menubar: true,
          branding: false,
          promotion: false,
          statusbar: true,
          resize: true,
          plugins: [
            'advlist',
            'autolink',
            'lists',
            'link',
            'image',
            'charmap',
            'preview',
            'anchor',
            'searchreplace',
            'visualblocks',
            'code',
            'fullscreen',
            'insertdatetime',
            'media',
            'table',
            'wordcount'
          ],
          toolbar:
            'undo redo | blocks fontfamily fontsize | ' +
            'bold italic underline strikethrough forecolor backcolor | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | table | link image media | ' +
            'removeformat | code fullscreen preview',
          content_style:
            'body { font-family:Arial,sans-serif; font-size:14px; line-height:1.6; }',
          placeholder,
          automatic_uploads: false,
          file_picker_types: 'image',
          file_picker_callback: (cb, _value, meta) => {
            if (meta.filetype !== 'image') return;
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.onchange = () => {
              const file = input.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                cb(String(reader.result || ''), { title: file.name });
              };
              reader.readAsDataURL(file);
            };
            input.click();
          }
        }}
      />
    </div>
  );
};

export default RichTextEditor;
