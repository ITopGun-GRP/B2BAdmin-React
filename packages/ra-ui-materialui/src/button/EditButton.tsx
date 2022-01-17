import * as React from 'react';
import { ReactElement, useMemo } from 'react';
import PropTypes from 'prop-types';
import ContentCreate from '@mui/icons-material/Create';
import { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import { Link } from 'react-router-dom';
import {
    linkToRecord,
    RaRecord,
    useResourceContext,
    useRecordContext,
} from 'ra-core';

import { Button, ButtonProps } from './Button';

/**
 * Opens the Edit view of a given record:
 *
 * @example // basic usage
 * import { EditButton } from 'react-admin';
 *
 * const CommentEditButton = ({ record }) => (
 *     <EditButton basePath="/comments" label="Edit comment" record={record} />
 * );
 */
export const EditButton = (props: EditButtonProps) => {
    const {
        icon = defaultIcon,
        label = 'ra.action.edit',
        scrollToTop = true,
        ...rest
    } = props;
    const resource = useResourceContext(props);
    const record = useRecordContext(props);
    return (
        <Button
            component={Link}
            to={useMemo(
                () => ({
                    pathname: record
                        ? linkToRecord(`/${resource}`, record.id)
                        : '',
                    state: { _scrollToTop: scrollToTop },
                }),
                [record, resource, scrollToTop]
            )}
            label={label}
            onClick={stopPropagation}
            {...(rest as any)}
        >
            {icon}
        </Button>
    );
};

const defaultIcon = <ContentCreate />;

// useful to prevent click bubbling in a datagrid with rowClick
const stopPropagation = e => e.stopPropagation();

interface Props {
    basePath?: string;
    icon?: ReactElement;
    label?: string;
    record?: RaRecord;
    scrollToTop?: boolean;
}

export type EditButtonProps = Props & ButtonProps & MuiButtonProps;

EditButton.propTypes = {
    basePath: PropTypes.string,
    icon: PropTypes.element,
    label: PropTypes.string,
    record: PropTypes.any,
    scrollToTop: PropTypes.bool,
};
